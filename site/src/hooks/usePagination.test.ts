import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from './usePagination';
import { ICONS_PER_PAGE } from '../constants';

const makeIcons = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `i${i}` }));
const icons = makeIcons(100);

describe('usePagination', () => {
  beforeEach(() => {
    // jsdom n'implémente pas scrollTo
    window.scrollTo = vi.fn();
  });

  it('calcule le nombre de pages et paginé au départ', () => {
    const { result } = renderHook(() => usePagination({ filteredIcons: icons }));

    expect(result.current.totalFiltered).toBe(100);
    expect(result.current.totalPages).toBe(Math.ceil(100 / ICONS_PER_PAGE)); // 3
    expect(result.current.currentPage).toBe(1);
    expect(result.current.paginatedIcons).toHaveLength(ICONS_PER_PAGE);
    expect(result.current.paginatedIcons[0].id).toBe('i0');
  });

  it('toujours au moins 1 page même sans résultat', () => {
    const { result } = renderHook(() => usePagination({ filteredIcons: [] }));

    expect(result.current.totalFiltered).toBe(0);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedIcons).toHaveLength(0);
  });

  it('accumule depuis le début quand initialPage > 1', () => {
    const { result } = renderHook(() => usePagination({ filteredIcons: icons, initialPage: 2 }));

    expect(result.current.currentPage).toBe(2);
    // Modèle « accumulation » : la page 2 affiche les 2 × ICONS_PER_PAGE premières.
    expect(result.current.paginatedIcons).toHaveLength(2 * ICONS_PER_PAGE);
    expect(result.current.paginatedIcons[0].id).toBe('i0');
  });

  it('handlePageChange remonte la fenêtre et affiche la page cumulée', () => {
    const { result } = renderHook(() => usePagination({ filteredIcons: icons }));

    act(() => result.current.handlePageChange(3));

    expect(result.current.currentPage).toBe(3);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    // Page 3 : les 100 icônes sont désormais accumulées.
    expect(result.current.paginatedIcons).toHaveLength(100);
  });

  it('loadMore accumule la page suivante sans remonter la fenêtre', () => {
    const { result } = renderHook(() => usePagination({ filteredIcons: icons }));

    act(() => result.current.loadMore());

    expect(result.current.currentPage).toBe(2);
    expect(result.current.paginatedIcons).toHaveLength(2 * ICONS_PER_PAGE);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it('loadMore ne dépasse pas la dernière page', () => {
    const { result } = renderHook(() => usePagination({ filteredIcons: icons, initialPage: 3 }));

    act(() => result.current.loadMore());

    expect(result.current.currentPage).toBe(3);
    expect(result.current.paginatedIcons).toHaveLength(100);
  });

  it('remet à la page 1 quand la page courante dépasse le nouveau total', () => {
    const { result, rerender } = renderHook(({ list }) => usePagination({ filteredIcons: list }), {
      initialProps: { list: icons },
    });

    act(() => result.current.handlePageChange(3));
    expect(result.current.currentPage).toBe(3);

    // La liste se réduit (filtre plus strict) : la page 3 n'existe plus
    rerender({ list: makeIcons(10) });

    expect(result.current.totalPages).toBe(1);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.paginatedIcons).toHaveLength(10);
  });

  it('setCurrentPage expose un setter fonctionnel', () => {
    const { result } = renderHook(() => usePagination({ filteredIcons: icons }));

    act(() => result.current.setCurrentPage(2));
    expect(result.current.currentPage).toBe(2);
  });
});
