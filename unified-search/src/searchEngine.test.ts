import { describe, it, expect } from 'vitest';
import { createSearchEngine } from './searchEngine';
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

describe('createSearchEngine (repli sans worker)', () => {
  // disableWorker force le main-thread : c'est le chemin testable sous jsdom.
  it('résout ready immédiatement sans worker', async () => {
    const engine = createSearchEngine(ICONS, { disableWorker: true });
    await expect(engine.ready).resolves.toBeUndefined();
    engine.dispose();
  });

  it('retourne tous les IDs pour une requête vide', async () => {
    const engine = createSearchEngine(ICONS, { disableWorker: true });
    const ids = await engine.search('');
    expect(ids).toHaveLength(3);
    engine.dispose();
  });

  it('trouve un document par tag', async () => {
    const engine = createSearchEngine(ICONS, { disableWorker: true });
    expect(await engine.search('moon')).toContain('moon-1');
    engine.dispose();
  });

  it('trouve un document par titre', async () => {
    const engine = createSearchEngine(ICONS, { disableWorker: true });
    expect(await engine.search('sleeping')).toContain('cat-1');
    engine.dispose();
  });

  it('retourne un tableau vide (et non une rejection) pour une requête inconnue', async () => {
    const engine = createSearchEngine(ICONS, { disableWorker: true });
    await expect(engine.search('zzzzinexistant')).resolves.toEqual([]);
    engine.dispose();
  });

  it('gère les requêtes Lunr malformées sans throw (repli naïf)', async () => {
    const engine = createSearchEngine(ICONS, { disableWorker: true });
    // « moon AND » est absorbé par le parseur lenient de Lunr (pas d'erreur).
    const lenient = await engine.search('moon AND');
    expect(Array.isArray(lenient)).toBe(true);
    // « tags: » lève en revanche réellement (terme manquant après « : »).
    // Résoudre en [] ne peut venir QUE du catch + repli naïf (qui n'a aucun
    // littéral « tags: » à matcher dans les icônes).
    await expect(engine.search('tags:')).resolves.toEqual([]);
    engine.dispose();
  });

  it('après dispose(), les recherches retournent un tableau vide', async () => {
    const engine = createSearchEngine(ICONS, { disableWorker: true });
    engine.dispose();
    expect(await engine.search('moon')).toEqual([]);
  });

  it('fonctionne avec une collection vide', async () => {
    const engine = createSearchEngine([], { disableWorker: true });
    expect(await engine.search('')).toEqual([]);
    expect(await engine.search('moon')).toEqual([]);
    engine.dispose();
  });
});
