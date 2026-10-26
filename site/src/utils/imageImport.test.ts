import { describe, it, expect } from 'vitest';
import { GRID_BYTE_LENGTH, GRID_SIZE } from '../constants/editor';
import { getPixel, type PixelGrid } from './pixelEditor';
import {
  alphaBoxDownscale,
  fitAnalysisSize,
  imageDataToGrid,
  type ImageDataLike,
} from './imageImport';

const RED = [255, 0, 0, 255] as const;
const BLUE = [0, 0, 255, 255] as const;
const GREEN = [0, 255, 0, 255] as const;
const CLEAR = [0, 0, 0, 0] as const;

/** Fabrique une ImageDataLike remplie par une fonction `(x, y) => RGBA`. */
function makeImage(
  width: number,
  height: number,
  paint: (x: number, y: number) => readonly [number, number, number, number]
): ImageDataLike {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const color = paint(x, y);
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = color[3];
    }
  }
  return { data, width, height };
}

/** Lit un pixel d'une grille de taille quelconque (getPixel suppose 16×16). */
function pixelAt(grid: PixelGrid, size: number, x: number, y: number): number[] {
  const offset = (y * size + x) * 4;
  return [grid[offset], grid[offset + 1], grid[offset + 2], grid[offset + 3]];
}

describe('fitAnalysisSize', () => {
  it('conserve une image déjà petite', () => {
    expect(fitAnalysisSize(16, 16)).toEqual({ width: 16, height: 16 });
    expect(fitAnalysisSize(10, 30)).toEqual({ width: 10, height: 30 });
  });

  it('réduit une image trop grande en préservant le ratio', () => {
    expect(fitAnalysisSize(200, 100, 64)).toEqual({ width: 64, height: 32 });
    expect(fitAnalysisSize(100, 200, 64)).toEqual({ width: 32, height: 64 });
    expect(fitAnalysisSize(1000, 1000, 64)).toEqual({ width: 64, height: 64 });
  });

  it('garantit au moins un pixel par dimension', () => {
    expect(fitAnalysisSize(1, 5000, 64)).toEqual({ width: 1, height: 64 });
  });

  it('renvoie une taille nulle si l’image est vide', () => {
    expect(fitAnalysisSize(0, 0)).toEqual({ width: 0, height: 0 });
    expect(fitAnalysisSize(0, 50)).toEqual({ width: 0, height: 0 });
    expect(fitAnalysisSize(50, -1)).toEqual({ width: 0, height: 0 });
  });
});

describe('alphaBoxDownscale', () => {
  it('copie un pixel unique opaque', () => {
    const grid = alphaBoxDownscale(
      makeImage(2, 2, () => RED),
      1
    );
    expect(getPixel(grid, 0, 0)).toEqual([255, 0, 0, 255]);
  });

  it('moyenne l’alpha sans assombrir la couleur (prémultiplié)', () => {
    // 1 pixel rouge opaque + 3 transparents → alpha 64, rouge intact.
    const grid = alphaBoxDownscale(
      makeImage(2, 2, (x, y) => (x === 0 && y === 0 ? RED : CLEAR)),
      1
    );
    expect(getPixel(grid, 0, 0)).toEqual([255, 0, 0, 64]);
  });

  it('produit une couleur unie pour une source unie', () => {
    const grid = alphaBoxDownscale(
      makeImage(4, 2, () => GREEN),
      2
    );
    expect(pixelAt(grid, 2, 0, 0)).toEqual([0, 255, 0, 255]);
    expect(pixelAt(grid, 2, 1, 1)).toEqual([0, 255, 0, 255]);
  });

  it('sépare deux zones de couleur côte à côte', () => {
    const image = makeImage(2, 2, (x) => (x === 0 ? BLUE : RED));
    const grid = alphaBoxDownscale(image, 2);
    expect(pixelAt(grid, 2, 0, 0)).toEqual([0, 0, 255, 255]);
    expect(pixelAt(grid, 2, 1, 0)).toEqual([255, 0, 0, 255]);
  });

  it('gère une taille cible supérieure à la source (aucun bloc vide)', () => {
    const image = makeImage(2, 2, (x, y) => ((x + y) % 2 === 0 ? RED : BLUE));
    const grid = alphaBoxDownscale(image, 4);
    expect(pixelAt(grid, 4, 0, 0)).toEqual([255, 0, 0, 255]);
    expect(grid.length).toBe(4 * 4 * 4);
  });
});

describe('imageDataToGrid', () => {
  it('recopie à l’identique une image déjà en 16×16', () => {
    const image = makeImage(GRID_SIZE, GRID_SIZE, (x, y) => ((x + y) % 2 === 0 ? RED : CLEAR));
    const grid = imageDataToGrid(image) as PixelGrid;

    expect(grid.length).toBe(GRID_BYTE_LENGTH);
    expect(Array.from(grid)).toEqual(Array.from(image.data));
    expect(grid).not.toBe(image.data);
  });

  it('réduit une image plus grande en 16×16', () => {
    const grid = imageDataToGrid(makeImage(32, 32, () => BLUE)) as PixelGrid;
    expect(getPixel(grid, 0, 0)).toEqual([0, 0, 255, 255]);
    expect(getPixel(grid, GRID_SIZE - 1, GRID_SIZE - 1)).toEqual([0, 0, 255, 255]);
    // Chaque pixel de destination agrège un bloc 2×2.
    expect(getPixel(grid, 5, 5)).toEqual([0, 0, 255, 255]);
  });

  it('renvoie null si la longueur des données ne correspond pas', () => {
    const image = makeImage(16, 16, () => RED);
    image.data = new Uint8ClampedArray(10);
    expect(imageDataToGrid(image)).toBeNull();
  });

  it('renvoie null si les dimensions sont nulles', () => {
    expect(imageDataToGrid({ data: new Uint8ClampedArray(0), width: 0, height: 0 })).toBeNull();
    expect(imageDataToGrid({ data: new Uint8ClampedArray(4), width: 1, height: 0 })).toBeNull();
  });
});
