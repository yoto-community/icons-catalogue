import { describe, it, expect } from 'vitest';
import { GRID_BYTE_LENGTH, GRID_SIZE, HISTORY_LIMIT, PIXEL_COUNT } from '../constants/editor';
import {
  TRANSPARENT,
  cloneGrid,
  countColors,
  createEditorState,
  createGrid,
  decodeGrid,
  editorReducer,
  encodeGrid,
  floodFill,
  getPixel,
  hasPureBlack,
  hexToRgba,
  isEmpty,
  isInside,
  rgbaToHex,
  setPixel,
  toIndex,
  type Rgba,
} from './pixelEditor';

const BLACK: Rgba = [0, 0, 0, 255];
const RED: Rgba = [255, 0, 0, 255];
const BLUE: Rgba = [0, 0, 255, 255];
const WHITE: Rgba = [255, 255, 255, 255];

describe('createGrid', () => {
  it('crée une grille transparente de la bonne taille', () => {
    const grid = createGrid();
    expect(grid.length).toBe(GRID_BYTE_LENGTH);
    expect(isEmpty(grid)).toBe(true);
    expect(Array.from(grid).every((byte) => byte === 0)).toBe(true);
  });

  it('remplit la grille avec la couleur fournie', () => {
    const grid = createGrid(RED);
    expect(getPixel(grid, 0, 0)).toEqual(RED);
    expect(getPixel(grid, GRID_SIZE - 1, GRID_SIZE - 1)).toEqual(RED);
    expect(countColors(grid)).toBe(1);
  });
});

describe('cloneGrid', () => {
  it('produit une copie indépendante', () => {
    const original = createGrid();
    setPixel(original, 0, 0, RED);
    const copy = cloneGrid(original);
    setPixel(copy, 0, 0, BLACK);
    expect(getPixel(original, 0, 0)).toEqual(RED);
    expect(getPixel(copy, 0, 0)).toEqual(BLACK);
  });
});

describe('hexToRgba', () => {
  it('accepte la notation #rgb', () => {
    expect(hexToRgba('#000')).toEqual([0, 0, 0, 255]);
    expect(hexToRgba('#f00')).toEqual([255, 0, 0, 255]);
    expect(hexToRgba('#abc')).toEqual([170, 187, 204, 255]);
  });

  it('accepte la notation #rrggbb', () => {
    expect(hexToRgba('#ff8800')).toEqual([255, 136, 0, 255]);
  });

  it('accepte la notation #rrggbbaa (alpha)', () => {
    expect(hexToRgba('#ff880080')).toEqual([255, 136, 0, 128]);
    expect(hexToRgba('#00000000')).toEqual([0, 0, 0, 0]);
  });

  it('tolère l’absence de #, la casse et les espaces', () => {
    expect(hexToRgba('FF8800')).toEqual([255, 136, 0, 255]);
    expect(hexToRgba('  #ff8800  ')).toEqual([255, 136, 0, 255]);
  });

  it('renvoie null pour une saisie invalide', () => {
    expect(hexToRgba('')).toBeNull();
    expect(hexToRgba('#12345')).toBeNull();
    expect(hexToRgba('#1234567')).toBeNull();
    expect(hexToRgba('#gggggg')).toBeNull();
    expect(hexToRgba('rouge')).toBeNull();
  });
});

describe('rgbaToHex', () => {
  it('omet l’alpha opaque', () => {
    expect(rgbaToHex([255, 0, 0, 255])).toBe('#ff0000');
  });

  it('inclut l’alpha translucide', () => {
    expect(rgbaToHex([0, 0, 0, 128])).toBe('#00000080');
    expect(rgbaToHex(TRANSPARENT)).toBe('#00000000');
  });

  it('borne et arrondit chaque canal', () => {
    expect(rgbaToHex([-5, 300, 2.6, 255])).toBe('#00ff03');
  });
});

describe('toIndex / isInside', () => {
  it('calcule l’offset octet d’un pixel', () => {
    expect(toIndex(0, 0)).toBe(0);
    expect(toIndex(1, 0)).toBe(4);
    expect(toIndex(0, 1)).toBe(GRID_SIZE * 4);
    expect(toIndex(GRID_SIZE - 1, GRID_SIZE - 1)).toBe(GRID_BYTE_LENGTH - 4);
  });

  it('délimite la grille', () => {
    expect(isInside(0, 0)).toBe(true);
    expect(isInside(GRID_SIZE - 1, GRID_SIZE - 1)).toBe(true);
    expect(isInside(-1, 0)).toBe(false);
    expect(isInside(0, -1)).toBe(false);
    expect(isInside(GRID_SIZE, 0)).toBe(false);
    expect(isInside(0, GRID_SIZE)).toBe(false);
  });
});

describe('getPixel / setPixel', () => {
  it('getPixel renvoie la couleur ou null hors limites', () => {
    const grid = createGrid();
    expect(getPixel(grid, 0, 0)).toEqual(TRANSPARENT);
    expect(getPixel(grid, -1, 0)).toBeNull();
    expect(getPixel(grid, GRID_SIZE, 0)).toBeNull();
  });

  it('setPixel écrit dans les limites et refuse au-dehors', () => {
    const grid = createGrid();
    expect(setPixel(grid, 2, 3, RED)).toBe(true);
    expect(getPixel(grid, 2, 3)).toEqual(RED);
    expect(setPixel(grid, GRID_SIZE, 0, RED)).toBe(false);
  });
});

describe('floodFill', () => {
  it('remplit toute la grille uniforme', () => {
    const grid = createGrid();
    expect(floodFill(grid, 0, 0, RED)).toBe(PIXEL_COUNT);
    expect(countColors(grid)).toBe(1);
    expect(getPixel(grid, GRID_SIZE - 1, GRID_SIZE - 1)).toEqual(RED);
  });

  it('s’arrête aux frontières de couleur', () => {
    const grid = createGrid(RED);
    for (let y = 0; y < GRID_SIZE; y++) setPixel(grid, 8, y, BLUE);
    const filled = floodFill(grid, 0, 0, WHITE);

    expect(filled).toBe(8 * GRID_SIZE);
    expect(getPixel(grid, 7, 0)).toEqual(WHITE);
    expect(getPixel(grid, 8, 0)).toEqual(BLUE);
    expect(getPixel(grid, 9, 0)).toEqual(RED);
  });

  it('ne propage pas en diagonale (connectivité 4 voies)', () => {
    const grid = createGrid(RED);
    setPixel(grid, 0, 0, TRANSPARENT);
    setPixel(grid, 1, 1, TRANSPARENT);
    expect(floodFill(grid, 0, 0, WHITE)).toBe(1);
    expect(getPixel(grid, 0, 0)).toEqual(WHITE);
    expect(getPixel(grid, 1, 1)).toEqual(TRANSPARENT);
  });

  it('ne fait rien si la couleur cible égale la couleur de remplissage', () => {
    const grid = createGrid(RED);
    expect(floodFill(grid, 0, 0, RED)).toBe(0);
  });

  it('ne fait rien hors limites', () => {
    const grid = createGrid();
    expect(floodFill(grid, -1, 0, RED)).toBe(0);
  });
});

describe('isEmpty', () => {
  it('ignore la couleur des pixels transparents', () => {
    const grid = createGrid();
    setPixel(grid, 0, 0, [12, 34, 56, 0]);
    expect(isEmpty(grid)).toBe(true);
  });

  it('détecte le moindre pixel opaque', () => {
    const grid = createGrid();
    setPixel(grid, GRID_SIZE - 1, GRID_SIZE - 1, RED);
    expect(isEmpty(grid)).toBe(false);
  });
});

describe('countColors', () => {
  it('compte les couleurs opaques distinctes', () => {
    const grid = createGrid();
    expect(countColors(grid)).toBe(0);
    setPixel(grid, 0, 0, RED);
    setPixel(grid, 1, 0, RED);
    setPixel(grid, 2, 0, BLUE);
    expect(countColors(grid)).toBe(2);
  });

  it('distingue deux alphas d’une même teinte', () => {
    const grid = createGrid();
    setPixel(grid, 0, 0, [255, 0, 0, 255]);
    setPixel(grid, 1, 0, [255, 0, 0, 128]);
    expect(countColors(grid)).toBe(2);
  });
});

describe('hasPureBlack', () => {
  it('faux sur une grille vide', () => {
    expect(hasPureBlack(createGrid())).toBe(false);
  });

  it('vrai dès qu’un pixel noir opaque existe', () => {
    const grid = createGrid();
    setPixel(grid, 4, 4, BLACK);
    expect(hasPureBlack(grid)).toBe(true);
  });

  it('faux pour un noir transparent ou un quasi-noir', () => {
    const grid = createGrid();
    setPixel(grid, 0, 0, [0, 0, 0, 0]);
    setPixel(grid, 1, 0, [1, 1, 1, 255]);
    expect(hasPureBlack(grid)).toBe(false);
  });
});

describe('encodeGrid / decodeGrid', () => {
  it('fait un aller-retour fidèle', () => {
    const grid = createGrid();
    setPixel(grid, 3, 4, [10, 20, 30, 200]);
    expect(decodeGrid(encodeGrid(grid))).toEqual(grid);
  });

  it('renvoie null pour une chaîne non décodable', () => {
    expect(decodeGrid('!!!pas du base64!!!')).toBeNull();
  });

  it('renvoie null pour une longueur inattendue', () => {
    expect(decodeGrid(btoa('court'))).toBeNull();
  });
});

describe('createEditorState', () => {
  it('part d’une grille vide, sans historique, outil crayon', () => {
    const state = createEditorState();
    expect(isEmpty(state.grid)).toBe(true);
    expect(state.past).toEqual([]);
    expect(state.future).toEqual([]);
    expect(state.tool).toBe('pencil');
  });

  it('accepte une grille initiale', () => {
    const grid = createGrid(RED);
    const state = createEditorState(grid);
    expect(getPixel(state.grid, 0, 0)).toEqual(RED);
    expect(state.past).toEqual([]);
  });
});

describe('editorReducer', () => {
  it('le crayon peint et empile l’historique', () => {
    const next = editorReducer(createEditorState(), { type: 'apply', x: 1, y: 2 });
    expect(getPixel(next.grid, 1, 2)).toEqual(next.color);
    expect(next.past).toHaveLength(1);
    expect(next.future).toEqual([]);
  });

  it('repeindre la même couleur n’ajoute pas d’historique', () => {
    const first = editorReducer(createEditorState(), { type: 'apply', x: 0, y: 0 });
    const second = editorReducer(first, { type: 'apply', x: 0, y: 0 });
    expect(second).toBe(first);
  });

  it('la gomme rend le pixel transparent, sans effet sur un pixel déjà vide', () => {
    const eraser = { ...createEditorState(), tool: 'eraser' as const };
    expect(editorReducer(eraser, { type: 'apply', x: 0, y: 0 })).toBe(eraser);

    const painted = editorReducer(createEditorState(), { type: 'apply', x: 0, y: 0 });
    const erased = editorReducer(
      { ...painted, tool: 'eraser' as const },
      { type: 'apply', x: 0, y: 0 }
    );
    expect(getPixel(erased.grid, 0, 0)).toEqual(TRANSPARENT);
  });

  it('le remplissage propage la couleur active', () => {
    const state = { ...createEditorState(), tool: 'fill' as const };
    const next = editorReducer(state, { type: 'apply', x: 0, y: 0 });
    expect(countColors(next.grid)).toBe(1);
  });

  it('le remplissage ne fait rien si la zone est déjà de la couleur active', () => {
    const state = { ...createEditorState(createGrid(BLACK)), tool: 'fill' as const };
    expect(editorReducer(state, { type: 'apply', x: 0, y: 0 })).toBe(state);
  });

  it('la pipette récupère la couleur sans modifier la grille ni l’historique', () => {
    const grid = createGrid();
    setPixel(grid, 5, 5, BLUE);
    const state = { ...createEditorState(grid), tool: 'picker' as const };

    const picked = editorReducer(state, { type: 'apply', x: 5, y: 5 });
    expect(picked.color).toEqual(BLUE);
    expect(picked.past).toHaveLength(0);
    expect(picked.grid).toBe(state.grid);
  });

  it('la pipette sur la couleur active ne change rien', () => {
    const state = { ...createEditorState(createGrid(BLACK)), tool: 'picker' as const };
    expect(editorReducer(state, { type: 'apply', x: 0, y: 0 })).toBe(state);
  });

  it('ignore une application hors limites', () => {
    const state = createEditorState();
    expect(editorReducer(state, { type: 'apply', x: -1, y: 0 })).toBe(state);
  });

  it('efface tout et empile l’historique, sans effet si déjà vide', () => {
    const state = createEditorState();
    expect(editorReducer(state, { type: 'clear' })).toBe(state);

    const painted = editorReducer(state, { type: 'apply', x: 0, y: 0 });
    const cleared = editorReducer(painted, { type: 'clear' });
    expect(isEmpty(cleared.grid)).toBe(true);
    expect(cleared.past).toHaveLength(2);
  });

  it('annule et rétablit un coup', () => {
    const painted = editorReducer(createEditorState(), { type: 'apply', x: 3, y: 3 });
    const undone = editorReducer(painted, { type: 'undo' });
    expect(isEmpty(undone.grid)).toBe(true);
    expect(undone.future).toHaveLength(1);

    const redone = editorReducer(undone, { type: 'redo' });
    expect(getPixel(redone.grid, 3, 3)).toEqual(painted.color);
    expect(redone.future).toHaveLength(0);
  });

  it('ne fait rien sans historique', () => {
    const state = createEditorState();
    expect(editorReducer(state, { type: 'undo' })).toBe(state);
    expect(editorReducer(state, { type: 'redo' })).toBe(state);
  });

  it('borne l’historique à la limite', () => {
    let state = createEditorState();
    for (let i = 0; i < HISTORY_LIMIT + 10; i++) {
      state = editorReducer(state, {
        type: 'apply',
        x: i % GRID_SIZE,
        y: Math.floor(i / GRID_SIZE),
      });
    }
    expect(state.past).toHaveLength(HISTORY_LIMIT);
  });

  it('charge une grille en repartant d’un historique vierge', () => {
    const painted = editorReducer(createEditorState(), { type: 'apply', x: 0, y: 0 });
    const loaded = editorReducer(painted, { type: 'load', grid: createGrid(RED) });
    expect(getPixel(loaded.grid, 0, 0)).toEqual(RED);
    expect(loaded.past).toEqual([]);
    expect(loaded.future).toEqual([]);
  });

  it('change la couleur et l’outil, sans toucher à l’historique', () => {
    const state = createEditorState();
    const colored = editorReducer(state, { type: 'setColor', color: RED });
    expect(colored.color).toEqual(RED);
    expect(colored.past).toHaveLength(0);
    expect(editorReducer(colored, { type: 'setColor', color: RED })).toBe(colored);

    const tooled = editorReducer(colored, { type: 'setTool', tool: 'fill' });
    expect(tooled.tool).toBe('fill');
    expect(editorReducer(tooled, { type: 'setTool', tool: 'fill' })).toBe(tooled);
  });
});
