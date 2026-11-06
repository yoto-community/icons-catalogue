import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { TOOLKIT_KEY, parseToolkit } from '../lib/sharedStorage';

const FAV_KEY = 'yoto-icons-favorites';

function wrapper({ children }: { children: ReactNode }) {
  return <FavoritesProvider>{children}</FavoritesProvider>;
}

describe('FavoritesContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('démarre sans favori et persiste les ajouts', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(result.current.favorites.size).toBe(0);

    act(() => {
      expect(result.current.toggleFavorite('a')).toBe(true);
    });

    expect(result.current.isFavorite('a')).toBe(true);
    expect(localStorage.getItem(FAV_KEY)).toBe(JSON.stringify(['a']));
  });

  it('retire un favori au second basculement', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => result.current.toggleFavorite('a'));
    act(() => {
      expect(result.current.toggleFavorite('a')).toBe(false);
    });

    expect(result.current.favorites.has('a')).toBe(false);
  });

  it('charge les favoris existants depuis localStorage', () => {
    localStorage.setItem(FAV_KEY, JSON.stringify(['x', 'y']));
    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect([...result.current.favorites].sort()).toEqual(['x', 'y']);
  });

  it('ignore un stockage corrompu', () => {
    localStorage.setItem(FAV_KEY, '{pas du json');
    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(result.current.favorites.size).toBe(0);
  });

  it('addFavorite est idempotent et removeFavorite tolère les absents', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => {
      result.current.addFavorite('a');
      result.current.addFavorite('a');
    });
    expect(result.current.favorites.size).toBe(1);

    act(() => result.current.removeFavorite('z'));
    expect(result.current.favorites.size).toBe(1);
  });

  it('clearFavorites vide la liste', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => result.current.addFavorite('a'));
    act(() => result.current.clearFavorites());

    expect(result.current.favorites.size).toBe(0);
  });

  it('se synchronise sur un événement de stockage inter-onglets', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => {
      localStorage.setItem(FAV_KEY, JSON.stringify(['z']));
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: FAV_KEY,
          oldValue: '[]',
          newValue: JSON.stringify(['z']),
        })
      );
    });

    expect(result.current.favorites.has('z')).toBe(true);
  });

  it('écrit les favoris dans la trousse partagée avec leur titre', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => result.current.toggleFavorite('icon-1', 'Moon'));

    const toolkit = parseToolkit(localStorage.getItem(TOOLKIT_KEY));
    expect(toolkit.items).toEqual([
      expect.objectContaining({ type: 'icon', id: 'icon-1', title: 'Moon' }),
    ]);
  });

  it('relit les icônes de la trousse même sans ancienne clé', () => {
    localStorage.setItem(
      TOOLKIT_KEY,
      JSON.stringify({
        version: 1,
        items: [{ type: 'icon', id: 'from-toolkit', title: 'Toolkit icon', addedAt: '2026-11-06' }],
      })
    );

    const { result } = renderHook(() => useFavorites(), { wrapper });

    expect(result.current.favorites.has('from-toolkit')).toBe(true);
  });

  it('met à jour les favoris quand la trousse change dans un autre onglet', () => {
    const { result } = renderHook(() => useFavorites(), { wrapper });

    act(() => {
      localStorage.setItem(
        TOOLKIT_KEY,
        JSON.stringify({
          version: 1,
          items: [{ type: 'icon', id: 'remote', title: 'Remote', addedAt: '2026-11-06' }],
        })
      );
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: TOOLKIT_KEY,
          oldValue: '[]',
          newValue: localStorage.getItem(TOOLKIT_KEY),
        })
      );
    });

    expect(result.current.favorites.has('remote')).toBe(true);
  });

  it('lève une erreur hors du provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useFavorites())).toThrow(
      /useFavorites must be used within a FavoritesProvider/
    );
    spy.mockRestore();
  });
});
