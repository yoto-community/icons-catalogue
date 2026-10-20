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

/**
 * Retourne le libellé lisible d'une catégorie :
 * traduction si connue, sinon capitalisation du slug.
 */
export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category.charAt(0).toUpperCase() + category.slice(1);
}

/**
 * Retourne l'emoji d'une catégorie, avec repli sur l'icône par défaut.
 */
export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] || DEFAULT_CATEGORY_ICON;
}
