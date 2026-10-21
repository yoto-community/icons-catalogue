import { useCallback, useEffect, useState } from 'react';

/** Préférence de thème : explicite (clair/sombre) ou alignée sur le système. */
export type ThemePreference = 'light' | 'dark' | 'system';
/** Thème réellement appliqué après résolution. */
export type ResolvedTheme = 'light' | 'dark';

/** Clé localStorage (ne pas renommer : valeur partagée avec le script inline). */
export const THEME_KEY = 'yoto-icons-theme';

const VALID_PREFERENCES: ThemePreference[] = ['light', 'dark', 'system'];

/** Résout la préférence en thème concret (P3.1). Pure et testable. */
export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system';
  const stored = localStorage.getItem(THEME_KEY);
  return VALID_PREFERENCES.includes(stored as ThemePreference)
    ? (stored as ThemePreference)
    : 'system';
}

function prefersDarkNow(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Gère le thème clair/sombre (P3.1) : préférence persistée (`light`/`dark`/
 * `system`), résolution du mode système, et application sur
 * `<html data-theme>`. Un seul consommateur (le sélecteur d'en-tête) suffit :
 * l'attribut est global.
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [systemDark, setSystemDark] = useState<boolean>(prefersDarkNow);

  const resolvedTheme = resolveTheme(preference, systemDark);

  // Suit les changements système (« system » uniquement, mais l'abonnement est
  // inoffensif dans les autres modes).
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);

    setSystemDark(query.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  // Applique le thème résolu sur <html>.
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    localStorage.setItem(THEME_KEY, next);
  }, []);

  return { preference, resolvedTheme, setPreference };
}
