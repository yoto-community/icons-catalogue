/**
 * Constantes partagées des catégories d'icônes.
 *
 * Source unique de vérité pour les libellés affichés et les icônes emoji.
 * Utilisé par CategoriesListPage et CategoryIconsPage (évite la duplication).
 */

export const CATEGORY_LABELS: Record<string, string> = {
  objets: 'Objets',
  nature: 'Nature',
  animaux: 'Animaux',
  musique: 'Musique',
  personnages: 'Personnages',
  fetes: 'Fêtes',
  transport: 'Transport',
  activites: 'Activités',
  emotions: 'Émotions',
  nourriture: 'Nourriture',
  batiments: 'Bâtiments',
  formes: 'Formes',
};

/** Libellés par défaut (fr) des sous-catégories canoniques. */
export const SUBCATEGORY_LABELS: Record<string, string> = {
  lune: 'Lune',
  soleil: 'Soleil',
  etoile: 'Étoile',
  coeur: 'Cœur',
  plante: 'Plante',
  chat: 'Chat',
  chien: 'Chien',
  oiseau: 'Oiseau',
  fleche: 'Flèche',
  animal: 'Animal',
  vehicule: 'Véhicule',
  batiment: 'Bâtiment',
  nourriture: 'Nourriture',
  musique: 'Musique',
  noel: 'Noël',
  halloween: 'Halloween',
  anniversaire: 'Anniversaire',
  autre: 'Autre',
};

export const CATEGORY_ICONS: Record<string, string> = {
  objets: '📦',
  nature: '🌿',
  animaux: '🐾',
  musique: '🎵',
  personnages: '👤',
  fetes: '🎉',
  transport: '🚌',
  activites: '⚽',
  emotions: '😊',
  nourriture: '🍎',
  batiments: '🏠',
  formes: '🔷',
};

/** Icône emoji par défaut pour une catégorie inconnue. */
export const DEFAULT_CATEGORY_ICON = '📁';

/** Traducteur optionnel `t(champ)` (cf. `useI18n`). */
export type Translator = (key: string) => string;

/** Capitalise un slug ASCII en repli (« objets » → « Objets »). */
function capitalize(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Retourne le libellé lisible d'une catégorie.
 *
 * Si un traducteur `t` est fourni et que la clé i18n existe
 * (`categoryLabels.<slug>`), sa valeur est utilisée ; sinon on retombe sur la
 * table fr statique puis sur la capitalisation du slug.
 */
export function getCategoryLabel(category: string, t?: Translator): string {
  if (t && CATEGORY_LABELS[category]) {
    const key = `categoryLabels.${category}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return CATEGORY_LABELS[category] || capitalize(category);
}

/**
 * Retourne le libellé lisible d'une sous-catégorie (mêmes règles que
 * {@link getCategoryLabel}, via `subcategoryLabels.<slug>`).
 */
export function getSubcategoryLabel(subcategory: string, t?: Translator): string {
  if (t && SUBCATEGORY_LABELS[subcategory]) {
    const key = `subcategoryLabels.${subcategory}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return SUBCATEGORY_LABELS[subcategory] || capitalize(subcategory);
}

/**
 * Retourne l'emoji d'une catégorie, avec repli sur l'icône par défaut.
 */
export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || DEFAULT_CATEGORY_ICON;
}
