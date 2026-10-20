import type { SortOption } from '../types';

/**
 * Options de tri valides (source unique de vérité, synchronisée avec types/SortOption).
 */
export const SORT_OPTIONS: readonly SortOption[] = ['downloads', 'title', 'date'] as const;

/**
 * Valide une valeur de tri provenant d'une query-string ou d'un <select>.
 * Aucun cast requis : le narrowing couvre explicitement chaque variante.
 * Retourne la valeur par défaut si l'entrée est absente ou invalide.
 */
export function toSortOption(
  value: string | null | undefined,
  fallback: SortOption = 'downloads'
): SortOption {
  if (value === 'downloads' || value === 'title' || value === 'date') {
    return value;
  }
  return fallback;
}

/**
 * Valide un numéro de page provenant d'une query-string (toujours >= 1).
 */
export function toPageNumber(value: string | null | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}
