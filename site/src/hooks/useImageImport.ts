import { useCallback, useState } from 'react';
import { decodeImageBlob } from '../utils/imageDecode';
import type { PixelGrid } from '../utils/pixelEditor';

/**
 * Erreur interne marquant un échec **de téléchargement** (réseau, CORS, HTTP)
 * par opposition à un échec de décodage. Sert uniquement à choisir le message
 * d'erreur ; elle ne quitte jamais ce module.
 */
class FetchImportError extends Error {}

/** Interface exposée par le hook. */
export interface UseImageImportResult {
  /** Un import est en cours (téléchargement/décodage). */
  isLoading: boolean;
  /** Clé i18n de l'erreur à afficher, ou `null`. */
  error: string | null;
  /** Importe un fichier local (option A). */
  importBlob: (blob: Blob) => Promise<PixelGrid | null>;
  /** Télécharge une URL puis l'importe (options B/C). */
  importUrl: (url: string) => Promise<PixelGrid | null>;
}

/**
 * Câble l'import d'image (L4) au-dessus de la frontière de décodage
 * (`utils/imageDecode.ts`). Gère les deux modes d'entrée — **fichier local** et
 * **URL** — en exposant un état de chargement et une **clé i18n d'erreur**
 * (jamais de texte codé en dur). Renvoie la grille importée, ou `null` en cas
 * d'échec (le message correspondant est alors disponible dans `error`).
 */
export function useImageImport(): UseImageImportResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (task: () => Promise<PixelGrid>): Promise<PixelGrid | null> => {
    setIsLoading(true);
    setError(null);
    try {
      return await task();
    } catch (cause) {
      setError(
        cause instanceof FetchImportError ? 'editor.import.errorFetch' : 'editor.import.errorDecode'
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importBlob = useCallback((blob: Blob) => run(() => decodeImageBlob(blob)), [run]);

  const importUrl = useCallback(
    (url: string) =>
      run(async () => {
        let response: Response;
        try {
          response = await fetch(url);
        } catch {
          // Échec réseau ou CORS : `fetch` rejette sans statut.
          throw new FetchImportError('fetch');
        }
        if (!response.ok) throw new FetchImportError(`http ${response.status}`);
        return decodeImageBlob(await response.blob());
      }),
    [run]
  );

  return { isLoading, error, importBlob, importUrl };
}
