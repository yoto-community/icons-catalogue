import type { SortOption } from '../types';
import { SOURCE_OPTIONS } from '../constants/filters';

/**
 * Options de tri valides (source unique de vérité, synchronisée avec types/SortOption).
 */
export const SORT_OPTIONS: readonly SortOption[] = ['downloads', 'title'] as const;

/**
 * Tri par défaut de l'application.
 *
 * `downloads` a longtemps paru inutile car le scraper yotoicons ne récupérait
 * PAS les compteurs réels de la page liste (seules ~32 icônes étaient > 0).
 * Depuis la correction du scraper, `downloads` est renseigné pour l'essentiel
 * du catalogue : le tri « popularité d'abord » redevient pertinent.
 * Centralisé ici pour rester la source unique de vérité.
 */
export const DEFAULT_SORT: SortOption = 'downloads';

/**
 * Valide une valeur de tri provenant d'une query-string ou d'un <select>.
 * Aucun cast requis : le narrowing couvre explicitement chaque variante.
 * Retourne la valeur par défaut si l'entrée est absente ou invalide.
 */
export function toSortOption(
  value: string | null | undefined,
  fallback: SortOption = DEFAULT_SORT
): SortOption {
  if (value === 'downloads' || value === 'title') {
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

/**
 * Valide une source provenant d'une query-string (whitelist stricte).
 * Retourne une chaîne vide quand la valeur est absente ou inconnue.
 */
export function toSourceFilter(value: string | null | undefined): string {
  return typeof value === 'string' && (SOURCE_OPTIONS as readonly string[]).includes(value)
    ? value
    : '';
}
