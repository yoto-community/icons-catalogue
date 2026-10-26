/**
 * Constantes de l'éditeur d'icônes 16×16 (L1).
 *
 * Concentrées ici pour rester la source unique de vérité partagée par la
 * logique pure (`utils/pixelEditor.ts`), l'export PNG (`utils/pngExport.ts`),
 * la persistance du brouillon (`utils/editorStorage.ts`) et les hooks.
 */

/** Côté de la grille d'édition : une icône Yoto fait 16×16 pixels. */
export const GRID_SIZE = 16;

/** Nombre de pixels d'une icône (16 × 16). */
export const PIXEL_COUNT = GRID_SIZE * GRID_SIZE;

/** Octets par pixel : RGBA 8 bits. */
export const BYTES_PER_PIXEL = 4;

/** Nombre d'octets d'une grille complète (`PIXEL_COUNT × 4`). */
export const GRID_BYTE_LENGTH = PIXEL_COUNT * BYTES_PER_PIXEL;

/** Profondeur maximale de l'historique undo/redo (en coups), pile bornée. */
export const HISTORY_LIMIT = 50;

/** Seuil d'avertissement sur le nombre de couleurs (règles de sobriété Yoto). */
export const COLOR_COUNT_WARN = 8;

/** Clé `localStorage` du brouillon (exigence E5). */
export const DRAFT_STORAGE_KEY = 'yoto-icons-editor-draft';

/** Version du schéma de brouillon : un changement de format invalide l'ancien. */
export const DRAFT_SCHEMA_VERSION = 1;

/** Délai d'auto-sauvegarde du brouillon (ms), pour ne pas écrire à chaque pixel. */
export const AUTOSAVE_DELAY_MS = 800;

/**
 * Palette de couleurs rapides (L2). 16 teintes lisibles sur petit écran,
 * servant de nuancier par défaut et de raccourcis clavier (`1`–`9` = 9 premières).
 * Les pixels restent stockés en RGBA : la palette n'est qu'un point d'entrée.
 */
export const EDITOR_PALETTE: readonly string[] = [
  '#000000',
  '#ffffff',
  '#7f7f7f',
  '#c0c0c0',
  '#e94560',
  '#ff8800',
  '#ffd400',
  '#33cc33',
  '#00bcd4',
  '#2b6cff',
  '#7c4dff',
  '#e91e63',
  '#8b4513',
  '#ffb6c1',
  '#00695c',
  '#000080',
];

/** Nom du fichier proposé au téléchargement du PNG. */
export const EDITOR_EXPORT_FILENAME = 'icone-yoto-16x16.png';
