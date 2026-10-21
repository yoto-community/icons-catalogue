import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme, THEME_KEY, resolveTheme, type ThemePreference } from './useTheme';

/**
 * Stub minimal de `window.matchMedia` pour `(prefers-color-scheme: dark)`.
 * `setMatches(bool)` simule un changement système.
 */
function stubMatchMedia(initial: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mql = {
    matches: initial,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  };
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mql as unknown as MediaQueryList)
  );
  return {
    setMatches(value: boolean) {
      mql.matches = value;
      listeners.forEach((listener) => listener({ matches: value } as MediaQueryListEvent));
    },
    listenerCount: () => listeners.size,
  };
}

describe('resolveTheme', () => {
  it('résout « system » selon la préférence du système', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('respecte une préférence explicite quel que soit le système', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('préfère « system » par défaut et résout en clair', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('system');
    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('résout « system » en sombre quand le système est sombre', () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useTheme());

    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('applique et persiste un thème explicite', () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setPreference('dark'));

    expect(result.current.preference).toBe('dark');
    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });

  it('recharge une préférence persistée', () => {
    localStorage.setItem(THEME_KEY, 'dark');
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('ignore une préférence persistée invalide', () => {
    localStorage.setItem(THEME_KEY, 'sepia');
    stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe('system');
  });

  it('suit les changements système en mode « system »', () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    expect(result.current.resolvedTheme).toBe('light');

    act(() => media.setMatches(true));

    expect(result.current.resolvedTheme).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('ignore les changements système en mode explicite', () => {
    const media = stubMatchMedia(false);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.setPreference('light'));
    act(() => media.setMatches(true));

    expect(result.current.resolvedTheme).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('retire l’écoute système au démontage', () => {
    const media = stubMatchMedia(false);
    const { unmount } = renderHook(() => useTheme());

    expect(media.listenerCount()).toBe(1);
    unmount();
    expect(media.listenerCount()).toBe(0);
  });

  it('accepte un type de préférence valide', () => {
    const preference: ThemePreference = 'system';
    expect(preference).toBe('system');
  });
});
