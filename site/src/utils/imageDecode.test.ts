import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GRID_SIZE } from '../constants/editor';
import { getPixel } from './pixelEditor';
import { decodeImageBlob } from './imageDecode';

interface FakeContext {
  imageSmoothingEnabled: boolean;
  drawImage: ReturnType<typeof vi.fn>;
  getImageData: ReturnType<typeof vi.fn>;
}

/** Installe un `createImageBitmap` et un contexte canvas factices. */
function stubBrowser(
  bitmap: { width: number; height: number; close?: () => void },
  pixels: (width: number, height: number) => Uint8ClampedArray
): { canvas: () => HTMLCanvasElement; context: FakeContext } {
  vi.stubGlobal(
    'createImageBitmap',
    vi.fn(async () => bitmap)
  );

  const context: FakeContext = {
    imageSmoothingEnabled: false,
    drawImage: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
      data: pixels(width, height),
      width,
      height,
    })),
  };

  // Capture le canvas créé par le code testé (jamais inséré dans le DOM).
  let created: HTMLCanvasElement | null = null;
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation(((
    tagName: string,
    options?: ElementCreationOptions
  ) => {
    const element = originalCreateElement(tagName, options);
    if (tagName === 'canvas') created = element as HTMLCanvasElement;
    return element;
  }) as typeof document.createElement);

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D
  );

  return { canvas: () => created as unknown as HTMLCanvasElement, context };
}

/** Remplit un tampon RGBA uni. */
function solid(width: number, height: number, color: [number, number, number, number]) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }
  return data;
}

describe('decodeImageBlob', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('recopie une image déjà en 16×16 et libère le bitmap', async () => {
    const close = vi.fn();
    stubBrowser({ width: 16, height: 16, close }, (w, h) => solid(w, h, [255, 0, 0, 255]));

    const grid = await decodeImageBlob(new Blob(['x']));

    expect(getPixel(grid, 0, 0)).toEqual([255, 0, 0, 255]);
    expect(getPixel(grid, GRID_SIZE - 1, GRID_SIZE - 1)).toEqual([255, 0, 0, 255]);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('réduit une image 32×32 et analyse à la taille native (≤ 64)', async () => {
    const { context } = stubBrowser({ width: 32, height: 32 }, (w, h) =>
      solid(w, h, [0, 0, 255, 255])
    );

    const grid = await decodeImageBlob(new Blob(['x']));

    expect(context.getImageData).toHaveBeenCalledWith(0, 0, 32, 32);
    expect(getPixel(grid, 3, 3)).toEqual([0, 0, 255, 255]);
  });

  it('borne la taille d’analyse des grandes images (ratio préservé)', async () => {
    const { canvas, context } = stubBrowser({ width: 200, height: 100 }, (w, h) =>
      solid(w, h, [0, 255, 0, 255])
    );

    await decodeImageBlob(new Blob(['x']));

    expect(context.getImageData).toHaveBeenCalledWith(0, 0, 64, 32);
    const el = canvas();
    expect(el.width).toBe(64);
    expect(el.height).toBe(32);
  });

  it('rejette si le contexte 2D est indisponible', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 16, height: 16 }))
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

    await expect(decodeImageBlob(new Blob(['x']))).rejects.toThrow();
  });

  it('rejette pour une image vide', async () => {
    stubBrowser({ width: 0, height: 0 }, (w, h) => solid(w, h, [0, 0, 0, 0]));

    await expect(decodeImageBlob(new Blob(['x']))).rejects.toThrow();
  });

  it('propage une erreur de décodage', async () => {
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => {
        throw new Error('format inconnu');
      })
    );

    await expect(decodeImageBlob(new Blob(['x']))).rejects.toThrow('format inconnu');
  });

  it('tolère un bitmap sans méthode close()', async () => {
    stubBrowser({ width: 16, height: 16 }, (w, h) => solid(w, h, [255, 255, 255, 255]));
    await expect(decodeImageBlob(new Blob(['x']))).resolves.toBeDefined();
  });
});
