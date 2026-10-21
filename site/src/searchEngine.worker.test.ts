import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSearchEngine, WORKER_READY_TIMEOUT_MS } from './searchEngine';
import type { Icon } from './types';

function makeIcon(id: string, overrides: Partial<Icon> = {}): Icon {
  return {
    id,
    source: 'yotoicons',
    tags: ['icon'],
    artist: 'artist',
    title: id,
    preview_image: '',
    download_url: '',
    category: 'objets',
    subcategory: 'autre',
    downloads: 0,
    date_added: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const ICONS = [
  makeIcon('moon-1', { title: 'crescent moon', tags: ['moon', 'night'], category: 'nature' }),
  makeIcon('cat-1', { title: 'sleeping cat', tags: ['cat', 'animal'], category: 'animaux' }),
  makeIcon('sun-1', { title: 'bright sun', tags: ['sun'], category: 'nature' }),
];

/**
 * Worker factice simulant le protocole de `workers/searchIndex.worker.ts` :
 * build → ready, search(id, query) → results(id, ids), error, onerror.
 * Permet de tester le vrai chemin asynchrone du moteur (inaccessible sous
 * jsdom, qui ne fournit pas Worker).
 */
class FakeWorker {
  static instances: FakeWorker[] = [];
  /** Répondre (ou non) immédiatement au build : contrôle du cycle « prêt ». */
  static respondToBuild = true;
  /** Simuler un échec de construction du Worker (throw). */
  static throwOnConstruct = false;

  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  readonly sent: Array<Record<string, unknown>> = [];
  terminated = false;
  /** Répondre (ou non) automatiquement aux requêtes de recherche. */
  autoResults = true;

  constructor(
    readonly url: URL | string,
    readonly options?: unknown
  ) {
    if (FakeWorker.throwOnConstruct) {
      throw new Error('construction impossible');
    }
    FakeWorker.instances.push(this);
  }

  postMessage(message: Record<string, unknown>): void {
    this.sent.push(message);

    if (message.type === 'build' && FakeWorker.respondToBuild) {
      const icons = (message.icons as unknown[] | undefined) ?? [];
      this.emit({ type: 'ready', count: icons.length });
      return;
    }

    if (message.type === 'search' && this.autoResults) {
      this.emit({ type: 'results', id: message.id, ids: [`worker-hit:${String(message.query)}`] });
    }
  }

  /** Simule une réponse entrante du worker. */
  emit(data: unknown): void {
    this.onmessage?.({ data });
  }

  /** Simule une erreur de chargement/execution du worker. */
  fail(error: unknown): void {
    this.onerror?.(error);
  }

  terminate(): void {
    this.terminated = true;
  }

  messagesOfType(type: string): Array<Record<string, unknown>> {
    return this.sent.filter((message) => message.type === type);
  }
}

describe('createSearchEngine (chemin Web Worker)', () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    FakeWorker.respondToBuild = true;
    FakeWorker.throwOnConstruct = false;
    vi.stubGlobal('Worker', FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("construit le worker avec l'URL du module et lui transmet l'index", async () => {
    const engine = createSearchEngine(ICONS);

    expect(FakeWorker.instances).toHaveLength(1);
    const worker = FakeWorker.instances[0];
    expect(String(worker.url)).toContain('workers/searchIndex.worker');
    expect(worker.options).toEqual({ type: 'module' });

    const builds = worker.messagesOfType('build');
    expect(builds).toHaveLength(1);
    expect(builds[0].icons).toHaveLength(3);

    await engine.ready;
    expect(engine.isReady()).toBe(true);
    engine.dispose();
  });

  it('délègue la recherche au worker et route sa réponse', async () => {
    const engine = createSearchEngine(ICONS);
    const worker = FakeWorker.instances[0];
    await engine.ready;

    await expect(engine.search('lune')).resolves.toEqual(['worker-hit:lune']);

    const searches = worker.messagesOfType('search');
    expect(searches).toHaveLength(1);
    expect(searches[0]).toEqual({ type: 'search', id: 1, query: 'lune' });
    engine.dispose();
  });

  it('requête vide = tous les IDs, sans solliciter le worker', async () => {
    const engine = createSearchEngine(ICONS);
    const worker = FakeWorker.instances[0];
    await engine.ready;

    await expect(engine.search('   ')).resolves.toHaveLength(3);
    expect(worker.messagesOfType('search')).toHaveLength(0);
    engine.dispose();
  });

  it('route les réponses par id même hors ordre (corrélation requête/réponse)', async () => {
    const engine = createSearchEngine(ICONS);
    const worker = FakeWorker.instances[0];
    worker.autoResults = false; // pilotage manuel des réponses
    await engine.ready;

    const first = engine.search('moon');
    const second = engine.search('cat');

    const searches = worker.messagesOfType('search');
    expect(searches).toHaveLength(2);
    const [msgFirst, msgSecond] = searches;
    expect(msgFirst.id).not.toBe(msgSecond.id);

    // Réponse de la DEUXIÈME requête avant la première : la corrélation doit
    // distribuer chaque réponse à son propre appelant (pas FIFO).
    worker.emit({ type: 'results', id: msgSecond.id, ids: ['second'] });
    worker.emit({ type: 'results', id: msgFirst.id, ids: ['first'] });

    await expect(first).resolves.toEqual(['first']);
    await expect(second).resolves.toEqual(['second']);
    engine.dispose();
  });

  it("avant le 'ready', cherche via le repli sans rien envoyer au worker", async () => {
    FakeWorker.respondToBuild = false; // build envoyé mais aucun signal retour
    const engine = createSearchEngine(ICONS);
    const worker = FakeWorker.instances[0];

    // On n'attend PAS `ready` (encore pendante) : la recherche ne doit pourtant
    // pas être bloquée — elle part immédiatement sur le repli main-thread.
    await expect(engine.search('moon')).resolves.toContain('moon-1');
    expect(worker.messagesOfType('search')).toHaveLength(0);
    expect(engine.isReady()).toBe(false);
    engine.dispose();
  });

  it('si la construction du Worker échoue, bascule sur le repli sans planter', async () => {
    FakeWorker.throwOnConstruct = true;
    const engine = createSearchEngine(ICONS);

    await engine.ready; // le catch libère ready immédiatement
    expect(engine.isReady()).toBe(false);
    expect(FakeWorker.instances).toHaveLength(0); // jamais instancié
    await expect(engine.search('moon')).resolves.toContain('moon-1');
    engine.dispose();
  });

  it('watchdog : ready se résout et bascule sur le repli si le worker ne répond jamais', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      FakeWorker.respondToBuild = false;
      const engine = createSearchEngine(ICONS);
      const worker = FakeWorker.instances[0];

      let settled = false;
      void engine.ready.then(() => {
        settled = true;
      });

      // Juste avant l'expiration : le worker a encore le bénéfice du doute.
      await vi.advanceTimersByTimeAsync(WORKER_READY_TIMEOUT_MS - 1);
      expect(settled).toBe(false);
      expect(worker.terminated).toBe(false);

      // À l'expiration : `ready` est libérée, le worker terminé, repli actif.
      await vi.advanceTimersByTimeAsync(1);
      await engine.ready;
      expect(settled).toBe(true);
      expect(worker.terminated).toBe(true);
      expect(engine.isReady()).toBe(false);
      await expect(engine.search('sleeping')).resolves.toContain('cat-1');

      engine.dispose();
    } finally {
      vi.useRealTimers();
    }
  });

  it("sur l'événement onerror du worker, bascule définitivement sur le repli", async () => {
    FakeWorker.respondToBuild = false;
    const engine = createSearchEngine(ICONS);
    const worker = FakeWorker.instances[0];

    worker.fail(new Error('chargement impossible'));
    await engine.ready;

    expect(engine.isReady()).toBe(false);
    await expect(engine.search('sleeping')).resolves.toContain('cat-1');
    engine.dispose();
  });

  it("sur message d'erreur du worker, le worker est abandonné (plus de recherche déléguée)", async () => {
    FakeWorker.respondToBuild = false;
    const engine = createSearchEngine(ICONS);
    const worker = FakeWorker.instances[0];

    worker.emit({ type: 'error', message: 'construction échouée' });
    await engine.ready;

    expect(engine.isReady()).toBe(false);
    await expect(engine.search('moon')).resolves.toContain('moon-1');

    // Abandon définitif : aucun message ne repart vers le worker.
    await engine.search('cat');
    expect(worker.messagesOfType('search')).toHaveLength(0);
    engine.dispose();
  });

  it('dispose() termine le worker et rend les recherches vides', async () => {
    const engine = createSearchEngine(ICONS);
    const worker = FakeWorker.instances[0];
    await engine.ready;

    engine.dispose();

    expect(worker.terminated).toBe(true);
    expect(engine.isReady()).toBe(false);
    await expect(engine.search('moon')).resolves.toEqual([]);
  });

  it('les réponses reçues après dispose() sont ignorées (pas de fuite)', async () => {
    const engine = createSearchEngine(ICONS);
    const worker = FakeWorker.instances[0];
    worker.autoResults = false;
    await engine.ready;

    const pending = engine.search('moon');
    engine.dispose();

    // Réponse orpheline : la promise reste neutralisée par le clear() de dispose.
    worker.emit({ type: 'results', id: 1, ids: ['stale'] });
    const settled = await Promise.race([
      pending,
      new Promise<'en attente'>((resolve) => setTimeout(() => resolve('en attente'), 10)),
    ]);
    expect(settled).toBe('en attente');
  });
});
