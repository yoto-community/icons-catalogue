import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { decodeImageBlob } from '../utils/imageDecode';
import { createGrid, type PixelGrid } from '../utils/pixelEditor';
import { useImageImport } from './useImageImport';

vi.mock('../utils/imageDecode', () => ({
  decodeImageBlob: vi.fn(),
  ImageDecodeError: class ImageDecodeError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ImageDecodeError';
    }
  },
}));

const decodeMock = vi.mocked(decodeImageBlob);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('useImageImport', () => {
  it('importe un blob et expose la grille décodée', async () => {
    const grid = createGrid();
    decodeMock.mockResolvedValue(grid);
    const { result } = renderHook(() => useImageImport());

    let returned: PixelGrid | null = null;
    await act(async () => {
      returned = await result.current.importBlob(new Blob(['x']));
    });

    expect(returned).toBe(grid);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('signale le chargement pendant le décodage', async () => {
    let resolve!: (grid: PixelGrid) => void;
    decodeMock.mockImplementation(
      () =>
        new Promise<PixelGrid>((r) => {
          resolve = r;
        })
    );
    const { result } = renderHook(() => useImageImport());

    let pending!: Promise<PixelGrid | null>;
    act(() => {
      pending = result.current.importBlob(new Blob(['x']));
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolve(createGrid());
      await pending;
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('expose une clé d’erreur de décodage', async () => {
    decodeMock.mockRejectedValue(new Error('format inconnu'));
    const { result } = renderHook(() => useImageImport());

    let returned: PixelGrid | null = createGrid();
    await act(async () => {
      returned = await result.current.importBlob(new Blob(['x']));
    });

    expect(returned).toBeNull();
    expect(result.current.error).toBe('editor.import.errorDecode');
    expect(result.current.isLoading).toBe(false);
  });

  it('télécharge une URL puis décode le blob reçu', async () => {
    const blob = new Blob(['x']);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, blob: async () => blob }) as unknown as Response)
    );
    decodeMock.mockResolvedValue(createGrid());
    const { result } = renderHook(() => useImageImport());

    await act(async () => {
      await result.current.importUrl('https://exemple.test/icone.png');
    });

    expect(fetch).toHaveBeenCalledWith('https://exemple.test/icone.png');
    expect(decodeMock).toHaveBeenCalledWith(blob);
    expect(result.current.error).toBeNull();
  });

  it('expose une clé d’erreur réseau (CORS)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      })
    );
    const { result } = renderHook(() => useImageImport());

    let returned: PixelGrid | null = createGrid();
    await act(async () => {
      returned = await result.current.importUrl('https://exemple.test/icone.png');
    });

    expect(returned).toBeNull();
    expect(result.current.error).toBe('editor.import.errorFetch');
    // Le décodage n'est jamais atteint si le téléchargement échoue.
    expect(decodeMock).not.toHaveBeenCalled();
  });

  it('expose une clé d’erreur HTTP (réponse non-ok)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 403 }) as unknown as Response)
    );
    const { result } = renderHook(() => useImageImport());

    await act(async () => {
      await result.current.importUrl('https://exemple.test/icone.png');
    });

    expect(result.current.error).toBe('editor.import.errorFetch');
  });

  it('efface l’erreur après un import réussi', async () => {
    decodeMock.mockRejectedValueOnce(new Error('nope'));
    const { result } = renderHook(() => useImageImport());

    await act(async () => {
      await result.current.importBlob(new Blob(['x']));
    });
    expect(result.current.error).not.toBeNull();

    decodeMock.mockResolvedValueOnce(createGrid());
    await act(async () => {
      await result.current.importBlob(new Blob(['x']));
    });

    expect(result.current.error).toBeNull();
  });
});
