import type { Icon } from './index';

/**
 * Champs minimaux qu'une entrée doit présenter pour être exploitée sans
 * risque par l'application (grille, filtres, carte d'icône). Le reste du
 * schéma est toléré manquant : la charge utile est produite par nos scripts,
 * mais une icône partielle ne doit pas faire tomber tout le catalogue.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Garde de runtime : vérifie qu'une valeur est un objet icône exploitable.
 */
function isIconRecord(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const icon = value as Record<string, unknown>;

  return (
    isNonEmptyString(icon.id) &&
    isNonEmptyString(icon.title) &&
    isNonEmptyString(icon.source) &&
    Array.isArray(icon.tags) &&
    icon.tags.every((tag) => typeof tag === 'string')
  );
}

/**
 * Assertion à la frontière réseau/JSON : valide qu'une charge utile est bien
 * un tableau d'icônes avant de la typer. Utilisée pour éviter les casts
 * aveugles du type `response.json() as Icon[]`.
 */
export function assertIconArray(payload: unknown): asserts payload is Icon[] {
  if (!Array.isArray(payload) || !payload.every(isIconRecord)) {
    throw new Error(
      "Charge utile invalide : un tableau d'icônes (id, title, source et tags) est attendu"
    );
  }
}
