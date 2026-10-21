import { describe, it, expect } from 'vitest';
import { buildSearchIndex, searchIdsFallback, toSearchableIcon } from './searchIndex';
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

describe('toSearchableIcon', () => {
  it('ne conserve que les champs indexés', () => {
    const icon = makeIcon('a', { downloads: 999, preview_image: 'x.png' });
    expect(toSearchableIcon(icon)).toEqual({
      id: 'a',
      tags: ['icon'],
      artist: 'artist',
      title: 'a',
      category: 'objets',
      subcategory: 'autre',
    });
  });
});

describe('buildSearchIndex', () => {
  const icons = [
    makeIcon('moon-1', { title: 'crescent moon', tags: ['moon', 'night'], category: 'nature' }),
    makeIcon('cat-1', { title: 'sleeping cat', tags: ['cat', 'animal'], category: 'animaux' }),
    makeIcon('sun-1', { title: 'bright sun', tags: ['sun'], category: 'nature' }),
  ];

  it('trouve un document par son tag (champ boosté)', () => {
    const index = buildSearchIndex(icons);
    const results = index.search('moon');
    expect(results.map((r) => r.ref)).toContain('moon-1');
  });

  it('trouve un document par son titre', () => {
    const index = buildSearchIndex(icons);
    expect(index.search('cat').map((r) => r.ref)).toContain('cat-1');
  });

  it('retourne un résultat vide pour un terme absent', () => {
    const index = buildSearchIndex(icons);
    expect(index.search('zzzzinexistant')).toHaveLength(0);
  });

  it('couvre toute la collection (une recherche large ne dépasse pas)', () => {
    const index = buildSearchIndex(icons);
    // Termes présents dans tous les documents
    const results = index.search('*');
    expect(results.length).toBeLessThanOrEqual(icons.length);
  });

  it('survit à un index vide', () => {
    const index = buildSearchIndex([]);
    expect(index.search('moon')).toHaveLength(0);
  });
});

describe('searchIdsFallback', () => {
  const icons = [
    makeIcon('moon-1', { title: 'crescent moon', tags: ['moon'], category: 'nature' }),
    makeIcon('cat-1', { title: 'sleeping cat', tags: ['cat'], category: 'animaux' }),
  ];

  it('requête vide = tous les IDs', () => {
    expect(searchIdsFallback(icons, '')).toEqual(new Set(['moon-1', 'cat-1']));
    expect(searchIdsFallback(icons, '   ')).toEqual(new Set(['moon-1', 'cat-1']));
  });

  it('filtre par terme (insensible à la casse)', () => {
    expect(searchIdsFallback(icons, 'MOON')).toEqual(new Set(['moon-1']));
  });

  it('applique une logique ET sur les termes multiples', () => {
    expect(searchIdsFallback(icons, 'sleeping cat')).toEqual(new Set(['cat-1']));
    // Aucun document ne satisfait les deux termes
    expect(searchIdsFallback(icons, 'moon cat')).toEqual(new Set());
  });

  it('recherche aussi dans les tags et la catégorie', () => {
    expect(searchIdsFallback(icons, 'animaux')).toEqual(new Set(['cat-1']));
  });
});
