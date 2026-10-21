import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Test du worker lui-même (`workers/searchIndex.worker.ts`).
 *
 * `searchEngine.worker.test.ts` couvre le protocole côté client via un
 * `FakeWorker` ; ici on charge le vrai module et on pilote `self.onmessage`
 * directement, pour verrouiller la logique interne (construction, mise en
 * tampon des requêtes, erreurs).
 */
const { buildSearchIndex } = vi.hoisted(() => ({ buildSearchIndex: vi.fn() }));

vi.mock('../searchIndex', () => ({ buildSearchIndex }));

type Listener = (event: { data: unknown }) => void;

interface FakeSelf {
  postMessage: ReturnType<typeof vi.fn>;
  onmessage: Listener | null;
}

/** Charge une instance fraîche du worker avec un `self` factice. */
async function setup(): Promise<FakeSelf> {
  vi.resetModules();
  buildSearchIndex.mockClear();

  const fakeSelf: FakeSelf = { postMessage: vi.fn(), onmessage: null };
  vi.stubGlobal('self', fakeSelf);
  await import('./searchIndex.worker');
  return fakeSelf;
}

/** Dépouille les messages postés, dans l'ordre. */
function messages(self: FakeSelf): unknown[] {
  return self.postMessage.mock.calls.map((call) => call[0]);
}

describe('searchIndex.worker', () => {
  beforeEach(() => {
    buildSearchIndex.mockReturnValue({ search: vi.fn(() => []) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('construit l’index sur « build » puis répond « ready » avec le compte', async () => {
    const self = await setup();
    const icons = [{ id: 'a' }, { id: 'b' }] as never[];

    self.onmessage!({ data: { type: 'build', icons } });

    expect(buildSearchIndex).toHaveBeenCalledTimes(1);
    expect(buildSearchIndex).toHaveBeenCalledWith(icons);
    expect(messages(self)).toEqual([{ type: 'ready', count: 2 }]);
  });

  it('après construction, délègue « search » à l’index et renvoie les refs', async () => {
    const self = await setup();
    buildSearchIndex.mockReturnValue({ search: vi.fn(() => [{ ref: 'a' }, { ref: 'b' }]) });

    self.onmessage!({ data: { type: 'build', icons: [] } });
    self.onmessage!({ data: { type: 'search', id: 7, query: 'moon' } });

    expect(messages(self)).toEqual([
      { type: 'ready', count: 0 },
      { type: 'results', id: 7, ids: ['a', 'b'] },
    ]);
  });

  it('met « search » en tampon avant la construction puis les rejoue dans l’ordre', async () => {
    const self = await setup();
    buildSearchIndex.mockReturnValue({ search: vi.fn(() => [{ ref: 'x' }]) });

    // Aucune construction encore : la requête ne peut pas partir.
    self.onmessage!({ data: { type: 'search', id: 1, query: 'moon' } });
    expect(self.postMessage).not.toHaveBeenCalled();

    self.onmessage!({ data: { type: 'build', icons: [] } });

    expect(messages(self)).toEqual([
      { type: 'ready', count: 0 },
      { type: 'results', id: 1, ids: ['x'] },
    ]);
  });

  it('une requête malformée renvoie un résultat vide au lieu d’échouer', async () => {
    const self = await setup();
    buildSearchIndex.mockReturnValue({
      search: vi.fn(() => {
        throw new Error('requête invalide');
      }),
    });

    self.onmessage!({ data: { type: 'build', icons: [] } });
    self.onmessage!({ data: { type: 'search', id: 3, query: '&&' } });

    expect(messages(self)).toEqual([
      { type: 'ready', count: 0 },
      { type: 'results', id: 3, ids: [] },
    ]);
  });

  it('un échec de construction poste une erreur (message d’Error)', async () => {
    const self = await setup();
    buildSearchIndex.mockImplementation(() => {
      throw new Error('boom');
    });

    self.onmessage!({ data: { type: 'build', icons: [] } });

    expect(messages(self)).toEqual([{ type: 'error', message: 'boom' }]);
  });

  it('un échec de construction non-Error poste un message générique', async () => {
    const self = await setup();
    buildSearchIndex.mockImplementation(() => {
      throw 'oops';
    });

    self.onmessage!({ data: { type: 'build', icons: [] } });

    expect(messages(self)).toEqual([{ type: 'error', message: 'Index build failed' }]);
  });

  it('ignore un second « build » une fois l’index prêt', async () => {
    const self = await setup();

    self.onmessage!({ data: { type: 'build', icons: [] } });
    self.onmessage!({ data: { type: 'build', icons: [] } });

    expect(buildSearchIndex).toHaveBeenCalledTimes(1);
  });

  it('ignore un « build » réentrant pendant la construction', async () => {
    const self = await setup();
    buildSearchIndex.mockImplementation(() => {
      // Réentrance : un build arrive alors que `building` est vrai.
      self.onmessage!({ data: { type: 'build', icons: [] } });
      return { search: vi.fn(() => []) };
    });

    self.onmessage!({ data: { type: 'build', icons: [] } });

    expect(buildSearchIndex).toHaveBeenCalledTimes(1);
  });
});
