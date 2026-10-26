import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFilteredIcons } from './useFilteredIcons';
import type { SearchEngine } from '../searchEngine';
import type { Icon, SortOption } from '../types';

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

const ICONS: Icon[] = [
  makeIcon('moon-1', {
    title: 'crescent moon',
    tags: ['moon'],
    category: 'nature',
    downloads: 10,
    date_added: '2026-03-01T00:00:00Z',
    source: 'yotopixels',
    license: 'Unspecified',
  }),
  makeIcon('cat-1', {
    title: 'sleeping cat',
    tags: ['cat'],
    category: 'animaux',
    downloads: 30,
    date_added: '2026-01-01T00:00:00Z',
    source: 'yotoicons',
    license: 'Source terms',
  }),
  makeIcon('sun-1', {
    title: 'bright sun',
    tags: ['sun'],
    category: 'nature',
    downloads: 20,
    date_added: '2026-02-01T00:00:00Z',
    source: 'yoto-official',
    license: 'Proprietary',
  }),
];

/**
 * Moteur simulé : contrôle exactement quels IDs la « recherche » retourne.
 * Permet de tester le pont asynchrone du hook sans Web Worker.
 */
function fakeEngine(matchingIds: string[]): SearchEngine {
  return {
    ready: Promise.resolve(),
    isReady: () => true,
    search: (query: string) =>
      Promise.resolve(query.trim() ? matchingIds : ICONS.map((icon) => icon.id)),
    dispose: () => {},
  };
}

function renderFiltered(overrides: Partial<Parameters<typeof useFilteredIcons>[0]> = {}) {
  const props = {
    icons: ICONS,
    searchEngine: fakeEngine(['moon-1']),
    query: '',
    category: '',
    subcategory: '',
    source: '',
    sortBy: 'downloads' as SortOption,
    ...overrides,
  };
  return renderHook(() => useFilteredIcons(props));
}

describe('useFilteredIcons', () => {
  it('retourne tout le catalogue sans requête ni filtre', () => {
    const { result } = renderFiltered();
    expect(result.current).toHaveLength(3);
  });

  it('applique le filtre de catégorie (en conservant le tri par défaut)', () => {
    const { result } = renderFiltered({ category: 'nature' });
    // Tri par défaut = téléchargements décroissants : sun-1 (20) > moon-1 (10)
    expect(result.current.map((icon) => icon.id)).toEqual(['sun-1', 'moon-1']);
  });

  it('applique le filtre de sous-catégorie', () => {
    const { result } = renderFiltered({ subcategory: 'autre' });
    expect(result.current).toHaveLength(3);
  });

  it('applique le filtre de source', () => {
    const { result } = renderFiltered({ source: 'yotopixels' });
    expect(result.current.map((icon) => icon.id)).toEqual(['moon-1']);
  });

  it('combine filtre de source ET de catégorie', () => {
    const { result } = renderFiltered({ source: 'yoto-official', category: 'nature' });
    expect(result.current.map((icon) => icon.id)).toEqual(['sun-1']);
  });

  it('trie par téléchargements décroissants (défaut)', () => {
    const { result } = renderFiltered({ sortBy: 'downloads' });
    expect(result.current.map((icon) => icon.id)).toEqual(['cat-1', 'sun-1', 'moon-1']);
  });

  it('trie par titre croissant', () => {
    const { result } = renderFiltered({ sortBy: 'title' });
    expect(result.current.map((icon) => icon.title)).toEqual([
      'bright sun',
      'crescent moon',
      'sleeping cat',
    ]);
  });

  it('attend la résolution ASYNCHRONE du moteur avant de filtrer', async () => {
    const { result } = renderFiltered({ query: 'moon', searchEngine: fakeEngine(['moon-1']) });

    // La recherche est en vol : le filtre texte n'est pas encore appliqué.
    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0].id).toBe('moon-1');
  });

  it('replie sur un résultat vide si le moteur ne retourne rien', async () => {
    const { result } = renderFiltered({ query: 'zzz', searchEngine: fakeEngine([]) });

    await waitFor(() => expect(result.current).toHaveLength(0));
  });

  it('replie sur un résultat vide si le moteur échoue', async () => {
    const failingEngine: SearchEngine = {
      ready: Promise.resolve(),
      isReady: () => true,
      search: () => Promise.reject(new Error('boom')),
      dispose: () => {},
    };
    const { result } = renderFiltered({ query: 'moon', searchEngine: failingEngine });

    await waitFor(() => expect(result.current).toHaveLength(0));
  });

  it('combine recherche textuelle ET filtre de catégorie', async () => {
    // Le moteur dit « moon-1 » et « sun-1 », mais la catégorie limite à nature.
    const { result } = renderFiltered({
      query: 'x',
      category: 'nature',
      searchEngine: fakeEngine(['moon-1', 'cat-1']),
    });

    await waitFor(() => expect(result.current).toHaveLength(1));
    expect(result.current[0].id).toBe('moon-1');
  });

  it('n’applique aucun filtre texte si le moteur est null', () => {
    const { result } = renderFiltered({ query: 'moon', searchEngine: null });
    expect(result.current).toHaveLength(3);
  });

  it('ne MUTATE PAS le tableau d’icônes d’origine lors du tri', () => {
    const before = ICONS.map((icon) => icon.id);
    renderFiltered({ sortBy: 'title' });
    expect(ICONS.map((icon) => icon.id)).toEqual(before);
  });
});
