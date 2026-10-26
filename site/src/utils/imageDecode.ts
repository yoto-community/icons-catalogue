/**
 * Décodage d'un fichier image en grille 16×16 (L4) — frontière navigateur.
 *
 * Seul module qui touche aux API de rendu (`createImageBitmap`, `<canvas>`).
 * Il est **isolé** du reste : la logique de réduction vit dans
 * `utils/imageImport.ts` (pure et testée à 100 %), et les tests unitaires
 * remplacent ici les globales du navigateur (jsdom n'a pas de canvas).
 *
 * Étapes : décoder → dessiner dans un canvas borné (`fitAnalysisSize`) →
 * `getImageData` → `imageDataToGrid`. Les images déjà en 16×16 sont recopiées
 * fidèlement (aucune mise à l'échelle).
 */

import { fitAnalysisSize, imageDataToGrid } from './imageImport';
import type { PixelGrid } from './pixelEditor';

/** Décodage natif indisponible (navigateur ancien, contexte 2D manquant…). */
export class ImageDecodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageDecodeError';
  }
}

/**
 * Décode un `Blob` image (PNG, JPEG, WebP, GIF…) en grille 16×16 RGBA.
 * Lève une `ImageDecodeError` si le décodage ou la lecture échoue.
 */
export async function decodeImageBlob(blob: Blob): Promise<PixelGrid> {
  const bitmap = await createImageBitmap(blob);
  try {
    const size = fitAnalysisSize(bitmap.width, bitmap.height);
    if (size.width === 0 || size.height === 0) {
      throw new ImageDecodeError('Image vide');
    }

    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;

    const context = canvas.getContext('2d');
    if (!context) throw new ImageDecodeError('Contexte 2D indisponible');

    // Ré-échantillonnage de qualité (surtout pour les photos) ; les images
    // 16×16 restent 1:1 grâce à `imageDataToGrid` (copie fidèle).
    context.imageSmoothingEnabled = true;
    context.drawImage(bitmap, 0, 0, size.width, size.height);

    const image = context.getImageData(0, 0, size.width, size.height);
    const grid = imageDataToGrid({ data: image.data, width: image.width, height: image.height });
    if (!grid) throw new ImageDecodeError('Pixels illisibles');

    return grid;
  } finally {
    bitmap.close?.();
  }
}
