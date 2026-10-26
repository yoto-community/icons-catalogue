/**
 * Navigation clavier de la grille d'édition 16×16 (L2).
 *
 * Logique **pure** et sans DOM, conformément à l'étude §7.6 : le réducteur de
 * navigation (flèches + bouclage aux bords) est testable hors React, le
 * composant `PixelGridEditor` ne fait que projeter le résultat sur le focus.
 */

import { GRID_SIZE } from '../constants/editor';
import type { EditorTool } from './pixelEditor';

/** Position d'une cellule dans la grille (0-indexée). */
export interface FocusPosition {
  x: number;
  y: number;
}

/**
 * Calcule la nouvelle position du focus pour une touche fléchée, avec
 * **bouclage** aux bords (ex. `ArrowLeft` sur la colonne 0 passe à droite).
 * Renvoie **le même objet** pour toute touche non gérée : l'appelant peut donc
 * tester l'égalité par référence pour savoir si la touche a été consommée.
 */
export function moveFocus(position: FocusPosition, key: string): FocusPosition {
  switch (key) {
    case 'ArrowLeft':
      return { x: (position.x + GRID_SIZE - 1) % GRID_SIZE, y: position.y };
    case 'ArrowRight':
      return { x: (position.x + 1) % GRID_SIZE, y: position.y };
    case 'ArrowUp':
      return { x: position.x, y: (position.y + GRID_SIZE - 1) % GRID_SIZE };
    case 'ArrowDown':
      return { x: position.x, y: (position.y + 1) % GRID_SIZE };
    default:
      return position;
  }
}

/** Indique si la touche déclenche une action (peinture) : Entrée ou Espace. */
export function isActivationKey(key: string): boolean {
  return key === 'Enter' || key === ' ' || key === 'Spacebar';
}

/**
 * Convertit une lettre en outil de dessin (`p` crayon, `g` gomme,
 * `f` remplissage, `b` pipette). Insensible à la casse ; `null` sinon.
 */
export function toolForShortcut(key: string): EditorTool | null {
  switch (key.toLowerCase()) {
    case 'p':
      return 'pencil';
    case 'g':
      return 'eraser';
    case 'f':
      return 'fill';
    case 'b':
      return 'picker';
    default:
      return null;
  }
}

/** Convertit un chiffre `1`–`9` en index de palette `0`–`8`, sinon `null`. */
export function paletteIndexForShortcut(key: string): number | null {
  if (key.length !== 1 || key < '1' || key > '9') return null;
  return key.charCodeAt(0) - 49;
}
