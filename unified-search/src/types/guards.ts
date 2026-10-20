import type { Icon } from './index';

/**
 * Garde de runtime : vérifie qu'une valeur est un objet icône exploitable.
 */
function isIconRecord(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  return 'id' in value && typeof value.id === 'string';
}

/**
 * Assertion à la frontière réseau/JSON : valide qu'une charge utile est bien
 * un tableau d'icônes avant de la typer. Utilisée pour éviter les casts
 * aveugles du type `response.json() as Icon[]`.
 */
export function assertIconArray(payload: unknown): asserts payload is Icon[] {
  if (!Array.isArray(payload) || !payload.every(isIconRecord)) {
    throw new Error("Charge utile invalide : un tableau d'icônes (id: string) est attendu");
  }
}
