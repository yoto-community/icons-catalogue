import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUrlSync } from './useUrlSync';
import type { UseUrlSyncProps } from './useUrlSync';
import type { SortOption } from '../types';

const defaults: UseUrlSyncProps = {
  query: '',
  category: '',
  subcategory: '',
  sortBy: 'downloads',
  currentPage: 1,
};

const readParams = () => new URLSearchParams(window.location.search);

describe('useUrlSync', () => {
  beforeEach(() => {
    // Remet l'URL à zéro entre chaque test (jsdom conserve l'historique)
    window.history.replaceState(null, '', '/');
  });

  it('écrit uniquement les paramètres non par défaut', () => {
    const { result } = renderHook(() =>
      useUrlSync({
        ...defaults,
        query: 'lune',
        category: 'nature',
        subcategory: 'plantes',
        sortBy: 'title',
        currentPage: 3,
      })
    );

    act(() => result.current.syncUrl());

    const params = readParams();
    expect(params.get('q')).toBe('lune');
    expect(params.get('cat')).toBe('nature');
    expect(params.get('subcat')).toBe('plantes');
    expect(params.get('sort')).toBe('title');
    expect(params.get('page')).toBe('3');
  });

  it("laisse l'URL vide quand tout est par défaut", () => {
    const { result } = renderHook(() => useUrlSync(defaults));

    act(() => result.current.syncUrl());

    expect(window.location.search).toBe('');
    expect(window.location.pathname).toBe('/');
  });

  it('retire les paramètres redevenus vides (via syncUrl manuel)', () => {
    const { result, rerender } = renderHook((p) => useUrlSync(p), {
      initialProps: { ...defaults, query: 'lune' },
    });

    act(() => result.current.syncUrl());
    expect(readParams().get('q')).toBe('lune');

    // La requête est effacée → le paramètre doit disparaître
    rerender({ ...defaults, query: '' });
    act(() => result.current.syncUrl());
    expect(readParams().get('q')).toBeNull();
    expect(window.location.search).toBe('');
  });

  it('respecte la requête avec espaces superflus (trim)', () => {
    const { result } = renderHook(() => useUrlSync({ ...defaults, query: '  étoile  ' }));

    act(() => result.current.syncUrl());

    expect(readParams().get('q')).toBe('étoile');
  });

  it("ne touche pas l'URL sans appel explicite à syncUrl (délégué au parent)", () => {
    const { rerender } = renderHook((p) => useUrlSync(p), { initialProps: defaults });

    rerender({ ...defaults, query: 'chat', currentPage: 2 });

    // Aucune écriture automatique : c'est le parent (useDebouncedSearch.onUrlSync)
    // qui déclenche syncUrl. On vérifie ici le contrat du hook lui-même.
    expect(window.location.search).toBe('');
  });

  it("ne marque sort que s'il diffère de 'downloads'", () => {
    const { result, rerender } = renderHook((p) => useUrlSync(p), {
      initialProps: { ...defaults, sortBy: 'date' as SortOption },
    });

    act(() => result.current.syncUrl());
    expect(readParams().get('sort')).toBe('date');

    rerender({ ...defaults, sortBy: 'downloads' });
    act(() => result.current.syncUrl());
    expect(readParams().get('sort')).toBeNull();
  });

  it("préserve les paramètres de recherche existants ailleurs dans l'URL", () => {
    window.history.replaceState(null, '', '/?utm_source=test');
    const { result } = renderHook(() => useUrlSync({ ...defaults, query: 'lune' }));

    act(() => result.current.syncUrl());

    const params = readParams();
    expect(params.get('utm_source')).toBe('test');
    expect(params.get('q')).toBe('lune');
  });
});
