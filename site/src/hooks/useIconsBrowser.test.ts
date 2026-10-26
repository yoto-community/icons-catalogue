import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIconsBrowser } from './useIconsBrowser';
import type { Icon } from '../types';
import { DEFAULT_SORT } from '../utils/urlParams';

function icon(overrides: Partial<Icon> & { id: string }): Icon {
  return {
    source: 'yotopixels',
    tags: [],
    artist: '@auteur',
    title: overrides.id,
    preview_image: 'p.png',
    download_url: 'd.png',
    category: 'nature',
    subcategory: 'lune',
    downloads: 0,
    date_added: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const ICONS: Icon[] = [
  icon({ id: 'n1', category: 'nature', subcategory: 'lune' }),
  icon({ id: 'n2', category: 'nature', subcategory: 'soleil' }),
  icon({ id: 'a1', category: 'animaux', subcategory: 'chat' }),
];

const base = {
  searchEngine: null,
  getSubcategories: (category: string) =>
    [
      ...new Set(
        ICONS.filter((i) => !category || i.category === category).map((i) => i.subcategory)
      ),
    ].sort(),
};

describe('useIconsBrowser', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('expose la liste filtrée et les sous-catégories de la catégorie courante', () => {
    const { result } = renderHook(() => useIconsBrowser({ ...base, icons: ICONS }));

    expect(result.current.totalFiltered).toBe(3);
    // Sans catégorie : toutes les sous-catégories.
    expect(result.current.subcategories).toEqual(['chat', 'lune', 'soleil']);

    act(() => result.current.handleCategoryChange('nature'));

    expect(result.current.category).toBe('nature');
    expect(result.current.totalFiltered).toBe(2);
    expect(result.current.subcategories).toEqual(['lune', 'soleil']);
  });

  it('réinitialise la sous-catégorie quand la catégorie change', () => {
    const { result } = renderHook(() => useIconsBrowser({ ...base, icons: ICONS }));

    act(() => result.current.handleCategoryChange('nature'));
    act(() => result.current.handleSubcategoryChange('lune'));
    expect(result.current.subcategory).toBe('lune');
    expect(result.current.totalFiltered).toBe(1);

    act(() => result.current.handleCategoryChange('animaux'));
    expect(result.current.subcategory).toBe('');
    expect(result.current.totalFiltered).toBe(1);
  });

  it('handleReset remet les filtres à zéro en conservant la catégorie imposée', () => {
    const { result } = renderHook(() =>
      useIconsBrowser({ ...base, icons: ICONS, lockedCategory: 'nature' })
    );

    act(() =>
      result.current.handleSearchChange({
        target: { value: 'lune' },
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    );
    act(() => result.current.handleSubcategoryChange('lune'));
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => result.current.handleReset());

    expect(result.current.query).toBe('');
    expect(result.current.subcategory).toBe('');
    expect(result.current.sortBy).toBe(DEFAULT_SORT);
    // La catégorie imposée est toujours appliquée…
    expect(result.current.category).toBe('nature');
    // …mais elle ne compte pas comme un filtre actif.
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('restaure les filtres depuis la query-string au montage', () => {
    window.history.replaceState(null, '', '/?q=lune&cat=nature&subcat=soleil&sort=title');

    const { result } = renderHook(() => useIconsBrowser({ ...base, icons: ICONS }));

    expect(result.current.query).toBe('lune');
    expect(result.current.category).toBe('nature');
    expect(result.current.subcategory).toBe('soleil');
    expect(result.current.sortBy).toBe('title');
  });

  it('restaure la page demandée quand elle existe', () => {
    // 60 icônes = 2 pages (ICONS_PER_PAGE = 48).
    const many = Array.from({ length: 60 }, (_, i) => icon({ id: `i${i}` }));
    window.history.replaceState(null, '', '/?page=2');

    const { result } = renderHook(() =>
      useIconsBrowser({ ...base, icons: many, getSubcategories: () => [] })
    );

    expect(result.current.totalPages).toBe(2);
    expect(result.current.currentPage).toBe(2);
  });

  it('ignore le paramètre `cat` de l’URL quand la catégorie est imposée', () => {
    window.history.replaceState(null, '', '/?cat=animaux&subcat=lune');

    const { result } = renderHook(() =>
      useIconsBrowser({ ...base, icons: ICONS, lockedCategory: 'nature' })
    );

    expect(result.current.category).toBe('nature');
    expect(result.current.subcategory).toBe('lune');
  });

  it('ne synchronise pas la catégorie imposée dans l’URL', () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() =>
        useIconsBrowser({ ...base, icons: ICONS, lockedCategory: 'nature' })
      );

      act(() => result.current.performSearch());
      act(() => vi.runAllTimers());

      expect(new URLSearchParams(window.location.search).get('cat')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('ne restaure rien quand restoreFromUrl est désactivé', () => {
    window.history.replaceState(null, '', '/?q=lune');

    const { result } = renderHook(() =>
      useIconsBrowser({ ...base, icons: ICONS, restoreFromUrl: false })
    );

    expect(result.current.query).toBe('');
  });

  it('appelle getSubcategories avec la catégorie courante', () => {
    const getSubcategories = vi.fn(() => ['x']);
    const { result } = renderHook(() =>
      useIconsBrowser({ ...base, icons: ICONS, getSubcategories })
    );

    expect(getSubcategories).toHaveBeenCalledWith('');
    act(() => result.current.handleCategoryChange('nature'));
    expect(getSubcategories).toHaveBeenLastCalledWith('nature');
    expect(result.current.subcategories).toEqual(['x']);
  });

  it('filtre par source puis réinitialise', () => {
    const icons = [
      icon({ id: 'p1', source: 'yotopixels', license: 'Unspecified' }),
      icon({ id: 'i1', source: 'yotoicons', license: 'Source terms' }),
    ];
    const { result } = renderHook(() =>
      useIconsBrowser({ ...base, icons, getSubcategories: () => [] })
    );

    act(() => result.current.handleSourceChange('yotopixels'));
    expect(result.current.source).toBe('yotopixels');
    expect(result.current.totalFiltered).toBe(1);
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => result.current.handleReset());
    expect(result.current.source).toBe('');
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('restaure la source depuis l’URL', () => {
    window.history.replaceState(null, '', '/?source=yotoicons');

    const { result } = renderHook(() => useIconsBrowser({ ...base, icons: ICONS }));

    expect(result.current.source).toBe('yotoicons');
    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('ignore une source invalide dans l’URL', () => {
    window.history.replaceState(null, '', '/?source=hacker');

    const { result } = renderHook(() => useIconsBrowser({ ...base, icons: ICONS }));

    expect(result.current.source).toBe('');
  });

  it('écrit la source dans l’URL après un changement (débounce)', () => {
    // Régression : la closure planifiée doit lire la valeur À JOUR, pas celle du
    // rendu précédent (sinon l'URL reste en retard d'un changement).
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/');
    try {
      const { result } = renderHook(() => useIconsBrowser({ ...base, icons: ICONS }));

      act(() => result.current.handleSourceChange('yotopixels'));
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(new URLSearchParams(window.location.search).get('source')).toBe('yotopixels');
    } finally {
      vi.useRealTimers();
    }
  });
});
