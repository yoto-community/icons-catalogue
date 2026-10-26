/**
 * Éditeur d'icônes 16×16 — modèle de données et logique pure (L1).
 *
 * Choix de conception :
 * - La grille est un `Uint8ClampedArray` **RGBA** de `GRID_BYTE_LENGTH` octets :
 *   c'est la **source de vérité unique** (DOM et canvas n'en sont que des
 *   projections, cf. étude §6.1/§7.3).
 * - Toutes les opérations de ce module sont **pures** et sans DOM : elles sont
 *   donc testables à 100 % (comme `zip.ts` / `highlight.ts`).
 * - Les mutations de grille se font **en place** (perf), l'historique undo/redo
 *   conservant des **copies** (`cloneGrid`) — d'où la copie avant mutation dans
 *   le réducteur.
 * - Aucune dépendance externe, cohérent avec le reste du dépôt.
 */

import {
  BYTES_PER_PIXEL,
  GRID_BYTE_LENGTH,
  GRID_SIZE,
  HISTORY_LIMIT,
  PIXEL_COUNT,
} from '../constants/editor';

/** Couleur RGBA, composantes 0–255. */
export type Rgba = [number, number, number, number];

/** Grille RGBA 16×16 mise à plat (`y × 16 + x`, 4 octets par pixel). */
export type PixelGrid = Uint8ClampedArray;

/** Outils de dessin disponibles. */
export type EditorTool = 'pencil' | 'eraser' | 'fill' | 'picker';

/** Pixel totalement transparent (valeur par défaut d'une grille vide). */
export const TRANSPARENT: Rgba = [0, 0, 0, 0];

/** Offset octet du pixel `(x, y)` (arithmétique pure, sans contrôle de bornes). */
export function toIndex(x: number, y: number): number {
  return (y * GRID_SIZE + x) * BYTES_PER_PIXEL;
}

/** Indique si `(x, y)` appartient à la grille. */
export function isInside(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
}

/** Écrit une couleur au pixel `pixel` (index de pixel, non octet). */
function writePixelAt(grid: PixelGrid, pixel: number, color: Rgba): void {
  const offset = pixel * BYTES_PER_PIXEL;
  grid[offset] = color[0];
  grid[offset + 1] = color[1];
  grid[offset + 2] = color[2];
  grid[offset + 3] = color[3];
}

/** Compare deux couleurs. */
function sameColor(a: Rgba, b: Rgba): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

/** Indique si le pixel `pixel` de la grille porte la couleur `color`. */
function matchesAt(grid: PixelGrid, pixel: number, color: Rgba): boolean {
  const offset = pixel * BYTES_PER_PIXEL;
  return (
    grid[offset] === color[0] &&
    grid[offset + 1] === color[1] &&
    grid[offset + 2] === color[2] &&
    grid[offset + 3] === color[3]
  );
}

/** Crée une grille vide, ou remplie d'une couleur unie. */
export function createGrid(fill: Rgba = TRANSPARENT): PixelGrid {
  const grid = new Uint8ClampedArray(GRID_BYTE_LENGTH);
  for (let pixel = 0; pixel < PIXEL_COUNT; pixel++) writePixelAt(grid, pixel, fill);
  return grid;
}

/** Copie indépendante d'une grille (pour l'historique). */
export function cloneGrid(grid: PixelGrid): PixelGrid {
  return new Uint8ClampedArray(grid);
}

/** Lit la couleur d'un pixel, ou `null` hors limites. */
export function getPixel(grid: PixelGrid, x: number, y: number): Rgba | null {
  if (!isInside(x, y)) return null;
  const offset = toIndex(x, y);
  return [grid[offset], grid[offset + 1], grid[offset + 2], grid[offset + 3]];
}

/** Écrit un pixel ; renvoie `false` si `(x, y)` est hors limites. */
export function setPixel(grid: PixelGrid, x: number, y: number, color: Rgba): boolean {
  if (!isInside(x, y)) return false;
  writePixelAt(grid, y * GRID_SIZE + x, color);
  return true;
}

/**
 * Remplissage par diffusion (« flood fill ») depuis `(x, y)`, connectivité 4
 * voies, sur la couleur unie de la zone. Renvoie le nombre de pixels changés
 * (0 si le point de départ est hors limites ou déjà de la couleur cible).
 */
export function floodFill(grid: PixelGrid, x: number, y: number, color: Rgba): number {
  if (!isInside(x, y)) return 0;
  const target = getPixel(grid, x, y) as Rgba;
  if (sameColor(target, color)) return 0;

  const seen = new Uint8Array(PIXEL_COUNT);
  const stack: number[] = [y * GRID_SIZE + x];
  let changed = 0;

  while (stack.length > 0) {
    const pixel = stack.pop() as number;
    if (seen[pixel] === 1) continue;
    seen[pixel] = 1;
    if (!matchesAt(grid, pixel, target)) continue;

    writePixelAt(grid, pixel, color);
    changed++;

    const px = pixel % GRID_SIZE;
    const py = (pixel - px) / GRID_SIZE;
    if (px > 0) stack.push(pixel - 1);
    if (px < GRID_SIZE - 1) stack.push(pixel + 1);
    if (py > 0) stack.push(pixel - GRID_SIZE);
    if (py < GRID_SIZE - 1) stack.push(pixel + GRID_SIZE);
  }

  return changed;
}

/** Indique si aucun pixel n'est visible (tous les alpha à 0). */
export function isEmpty(grid: PixelGrid): boolean {
  for (let offset = 3; offset < grid.length; offset += BYTES_PER_PIXEL) {
    if (grid[offset] !== 0) return false;
  }
  return true;
}

/** Nombre de couleurs RGBA distinctes parmi les pixels visibles. */
export function countColors(grid: PixelGrid): number {
  const colors = new Set<number>();
  for (let offset = 0; offset < grid.length; offset += BYTES_PER_PIXEL) {
    if (grid[offset + 3] === 0) continue;
    colors.add(
      (grid[offset] << 24) | (grid[offset + 1] << 16) | (grid[offset + 2] << 8) | grid[offset + 3]
    );
  }
  return colors.size;
}

/** Détecte un pixel noir pur visible (rendu invisible sur fond noir Yoto). */
export function hasPureBlack(grid: PixelGrid): boolean {
  for (let offset = 0; offset < grid.length; offset += BYTES_PER_PIXEL) {
    if (
      grid[offset + 3] > 0 &&
      grid[offset] === 0 &&
      grid[offset + 1] === 0 &&
      grid[offset + 2] === 0
    ) {
      return true;
    }
  }
  return false;
}

const HEX_PATTERN = /^[0-9a-f]+$/;

/** Convertit `#rgb`, `#rrggbb` ou `#rrggbbaa` (le `#` est optionnel) en RGBA. */
export function hexToRgba(input: string): Rgba | null {
  const value = input.trim().replace(/^#/, '').toLowerCase();
  if (!HEX_PATTERN.test(value)) return null;

  const byte = (index: number) => parseInt(value.slice(index, index + 2), 16);
  const nibble = (index: number) => parseInt(value[index] + value[index], 16);

  if (value.length === 3) {
    return [nibble(0), nibble(1), nibble(2), 255];
  }
  if (value.length === 6) {
    return [byte(0), byte(2), byte(4), 255];
  }
  if (value.length === 8) {
    return [byte(0), byte(2), byte(4), byte(6)];
  }
  return null;
}

/** Borne et arrondit une composante 0–255. */
function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/** Convertit du RGBA en hexadécimal (`#rrggbb`, alpha omis s'il est opaque). */
export function rgbaToHex(color: Rgba): string {
  const hex = (value: number) => clampChannel(value).toString(16).padStart(2, '0');
  const alpha = clampChannel(color[3]);
  return `#${hex(color[0])}${hex(color[1])}${hex(color[2])}${alpha === 255 ? '' : hex(alpha)}`;
}

/** Encode une grille en base64 (persistance, transport). */
export function encodeGrid(grid: PixelGrid): string {
  let binary = '';
  for (let i = 0; i < grid.length; i++) binary += String.fromCharCode(grid[i]);
  return btoa(binary);
}

/** Décode une grille encodée ; renvoie `null` si la donnée est invalide. */
export function decodeGrid(encoded: string): PixelGrid | null {
  let binary: string;
  try {
    binary = atob(encoded);
  } catch {
    return null;
  }
  if (binary.length !== GRID_BYTE_LENGTH) return null;

  const grid = new Uint8ClampedArray(GRID_BYTE_LENGTH);
  for (let i = 0; i < binary.length; i++) grid[i] = binary.charCodeAt(i);
  return grid;
}

/** État complet de l'éditeur (modèle + historique + outils). */
export interface EditorState {
  grid: PixelGrid;
  past: PixelGrid[];
  future: PixelGrid[];
  color: Rgba;
  tool: EditorTool;
}

/** Actions du réducteur (dispatchables depuis React). */
export type EditorAction =
  | { type: 'apply'; x: number; y: number }
  | { type: 'clear' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'setColor'; color: Rgba }
  | { type: 'setTool'; tool: EditorTool }
  | { type: 'load'; grid: PixelGrid };

/** Empile un instantané en respectant la borne de profondeur. */
function pushHistory(past: PixelGrid[], grid: PixelGrid): PixelGrid[] {
  const next = [...past, grid];
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
}

/** État initial : grille (vide par défaut), outil crayon, couleur noire opaque. */
export function createEditorState(
  grid: PixelGrid = createGrid(),
  color: Rgba = [0, 0, 0, 255]
): EditorState {
  return { grid, past: [], future: [], color, tool: 'pencil' };
}

/**
 * Réducteur pur de l'éditeur. Les actions qui modifient la grille empilent
 * l'état précédent (copie) et vident la branche « rétablir ». Les actions
 * idempotentes renvoient **le même objet** (pas de re-rendu inutile).
 */
export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'apply': {
      if (!isInside(action.x, action.y)) return state;

      if (state.tool === 'picker') {
        const picked = getPixel(state.grid, action.x, action.y) as Rgba;
        return sameColor(picked, state.color) ? state : { ...state, color: picked };
      }

      if (state.tool === 'pencil') {
        if (sameColor(getPixel(state.grid, action.x, action.y) as Rgba, state.color)) return state;
        const grid = cloneGrid(state.grid);
        setPixel(grid, action.x, action.y, state.color);
        return { ...state, grid, past: pushHistory(state.past, state.grid), future: [] };
      }

      if (state.tool === 'eraser') {
        const current = getPixel(state.grid, action.x, action.y) as Rgba;
        if (current[3] === 0) return state;
        const grid = cloneGrid(state.grid);
        setPixel(grid, action.x, action.y, TRANSPARENT);
        return { ...state, grid, past: pushHistory(state.past, state.grid), future: [] };
      }

      // Remplissage : rien à faire si le point de départ est déjà de la couleur.
      if (sameColor(getPixel(state.grid, action.x, action.y) as Rgba, state.color)) return state;
      const grid = cloneGrid(state.grid);
      floodFill(grid, action.x, action.y, state.color);
      return { ...state, grid, past: pushHistory(state.past, state.grid), future: [] };
    }

    case 'clear': {
      if (isEmpty(state.grid)) return state;
      return {
        ...state,
        grid: createGrid(),
        past: pushHistory(state.past, state.grid),
        future: [],
      };
    }

    case 'undo': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        grid: previous,
        past: state.past.slice(0, -1),
        future: [state.grid, ...state.future],
      };
    }

    case 'redo': {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return { ...state, grid: next, past: pushHistory(state.past, state.grid), future: rest };
    }

    case 'setColor':
      return sameColor(state.color, action.color) ? state : { ...state, color: action.color };

    case 'setTool':
      return state.tool === action.tool ? state : { ...state, tool: action.tool };

    case 'load':
      return { ...state, grid: cloneGrid(action.grid), past: [], future: [] };
  }
}
