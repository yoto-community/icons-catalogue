import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedSearch } from './useDebouncedSearch';
import { DEBOUNCE_MS } from '../constants';

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    // On ne fake que setTimeout/clearTimeout : les micro-tâches (React) restent réelles
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('regroupe les frappes rapprochées en un seul onSearch', () => {
    const onSearch = vi.fn();
    const { result } = renderHook(() => useDebouncedSearch({ onSearch }));

    act(() => {
      result.current.handleQueryChange('l', vi.fn());
      result.current.handleQueryChange('lu', vi.fn());
      result.current.handleQueryChange('lun', vi.fn());
    });

    // Rien avant la fin du délai (anti-rebond)
    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('applique la nouvelle valeur via setQuery', () => {
    const onSearch = vi.fn();
    const setQuery = vi.fn();
    const { result } = renderHook(() => useDebouncedSearch({ onSearch }));

    act(() => result.current.handleQueryChange('lune', setQuery));

    expect(setQuery).toHaveBeenCalledWith('lune');
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('diffère onUrlSync après urlSyncDelay (qui démarre à la recherche)', () => {
    const onSearch = vi.fn();
    const onUrlSync = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch({ onSearch, onUrlSync, urlSyncDelay: 50 })
    );

    act(() => result.current.handleQueryChange('x', vi.fn()));
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onUrlSync).not.toHaveBeenCalled(); // pas encore synchronisée

    act(() => vi.advanceTimersByTime(50));
    expect(onUrlSync).toHaveBeenCalledTimes(1);
  });

  it("recentre l'URL sync quand une nouvelle recherche part avant l'échéance", () => {
    const onSearch = vi.fn();
    const onUrlSync = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedSearch({ onSearch, onUrlSync, urlSyncDelay: 300 })
    );

    // Frappe 1 → recherche à t=80, URL sync planifiée à t=380
    act(() => result.current.handleQueryChange('a', vi.fn()));
    act(() => vi.advanceTimersByTime(DEBOUNCE_MS));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onUrlSync).not.toHaveBeenCalled();

    // Frappe 2 → recherche à t=160, ce qui REPOUSSE l'URL sync à t=460
    act(() => {
      result.current.handleQueryChange('ab', vi.fn());
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
    expect(onSearch).toHaveBeenCalledTimes(2);

    // t=380 : l'échéance INITIALE serait déjà passée si elle n'avait pas été repoussée
    act(() => vi.advanceTimersByTime(220));
    expect(onUrlSync).not.toHaveBeenCalled();

    // t=460 : la NOUVELLE échéance prend le relais
    act(() => vi.advanceTimersByTime(80));
    expect(onUrlSync).toHaveBeenCalledTimes(1);
  });

  it('performSearch déclenche immédiatement, sans attendre le délai', () => {
    const onSearch = vi.fn();
    const { result } = renderHook(() => useDebouncedSearch({ onSearch }));

    act(() => result.current.performSearch());

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("annule la recherche planifiée au démontage (pas d'appel orphelin)", () => {
    const onSearch = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedSearch({ onSearch }));

    act(() => result.current.handleQueryChange('x', vi.fn()));
    unmount();

    act(() => vi.advanceTimersByTime(DEBOUNCE_MS * 3));
    expect(onSearch).not.toHaveBeenCalled();
  });
});
