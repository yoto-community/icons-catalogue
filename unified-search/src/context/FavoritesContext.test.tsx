import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import type { ReactNode } from 'react';

const FAV_KEY = 'yoto-icons-favorites';

function wrapper({ children }: { children: ReactNode }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}

describe('FavoritesContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('démarre avec une liste vide', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect(result.current.favorites.size).toBe(0);
  });

  it('toggleFavorite ajoute puis retire', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => result.current.toggleFavorite('a'));
    expect(result.current.isFavorite('a')).toBe(true);

    act(() => result.current.toggleFavorite('a'));
    expect(result.current.isFavorite('a')).toBe(false);
  });

  it("persiste dans localStorage lors d'un changement local", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => result.current.addFavorite('x'));
    await waitFor(() => expect(localStorage.getItem(FAV_KEY)).toBe(JSON.stringify(['x'])));
  });

  it('clearFavorites vide la liste et le stockage', async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => result.current.addFavorite('x'));
    act(() => result.current.clearFavorites());

    expect(result.current.favorites.size).toBe(0);
    await waitFor(() => expect(localStorage.getItem(FAV_KEY)).toBe('[]'));
  });

  it('recharge les favoris depuis localStorage au montage', () => {
    localStorage.setItem(FAV_KEY, JSON.stringify(['a', 'b']));
    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(result.current.isFavorite('a')).toBe(true);
    expect(result.current.isFavorite('b')).toBe(true);
  });

  it('ignore un stockage corrompu sans planter', () => {
    localStorage.setItem(FAV_KEY, '{{{pas du json');
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect(result.current.favorites.size).toBe(0);
  });

  it('ignore un stockage de type incorrect (objet au lieu de tableau)', () => {
    localStorage.setItem(FAV_KEY, '{"a":true}');
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect(result.current.favorites.size).toBe(0);
  });

  it('ne retient que les entrées string (défense contre données hétérogènes)', () => {
    localStorage.setItem(FAV_KEY, JSON.stringify(['ok', 42, null, { id: 'x' }]));
    const { result } = renderHook(() => useFavorites(), { wrapper });
    expect([...result.current.favorites]).toEqual(['ok']);
  });

  it("réagit à un changement d'un autre onglet (event 'storage')", async () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    localStorage.setItem(FAV_KEY, JSON.stringify(['autre-onglet']));
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: FAV_KEY, newValue: '["autre-onglet"]' })
      );
    });

    await waitFor(() => expect(result.current.isFavorite('autre-onglet')).toBe(true));
  });
});
