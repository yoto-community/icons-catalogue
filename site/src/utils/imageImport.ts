/**
 * Import d'image → grille 16×16 (L4) : **logique pure**.
 *
 * Le décodage du fichier (PNG/JPEG…) est confié au navigateur
 * (`utils/imageDecode.ts`) car jsdom n'a ni `canvas` ni `createImageBitmap`.
 * Ce module ne manipule que des pixels bruts : il est donc testable à 100 % et
 * porte toute la mathématique de réduction.
 *
 * Deux propriétés importantes :
 * - **Moyenne prémultipliée par l'alpha** : un pixel rouge semi-transparent
 *   moyenné avec du transparent reste rouge, il ne « noircit » pas (sinon les
 *   bords des icônes transparentes bavent en gris).
 * - **Une image source déjà en 16×16 est recopiée pixel à pixel** (aucun
 *   ré-échantillonnage), pour « partir d'une icône » sans la dégrader.
 */

import { GRID_SIZE } from '../constants/editor';
import type { PixelGrid } from './pixelEditor';

/** Sous-ensemble d'`ImageData` (évite de dépendre du DOM dans la logique pure). */
export interface ImageDataLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Taille d'analyse maximale avant réduction vers 16×16 (borne le coût CPU). */
export const ANALYSIS_MAX_SIZE = 64;

/**
 * Calcule la taille d'analyse d'une image : au plus `max` sur le plus grand
 * côté, ratio préservé, jamais moins d'un pixel par dimension. Renvoie
 * `{ 0, 0 }` pour une image vide (dimension nulle).
 */
export function fitAnalysisSize(
  width: number,
  height: number,
  max: number = ANALYSIS_MAX_SIZE
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Réduit une image en `size × size` par moyenne de blocs (filtre « box »),
 * en moyennant les canaux **pondérés par l'alpha** puis en reconstituant
 * l'alpha moyen. Les blocs entièrement transparents restent transparents.
 */
export function alphaBoxDownscale(image: ImageDataLike, size: number = GRID_SIZE): PixelGrid {
  const { data, width, height } = image;
  const grid = new Uint8ClampedArray(size * size * 4);

  for (let dy = 0; dy < size; dy++) {
    const y0 = Math.floor((dy * height) / size);
    const y1 = Math.max(y0 + 1, Math.min(height, Math.floor(((dy + 1) * height) / size)));

    for (let dx = 0; dx < size; dx++) {
      const x0 = Math.floor((dx * width) / size);
      const x1 = Math.max(x0 + 1, Math.min(width, Math.floor(((dx + 1) * width) / size)));

      let sumAlpha = 0;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;
      let count = 0;

      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const offset = (y * width + x) * 4;
          const alpha = data[offset + 3];
          sumAlpha += alpha;
          sumR += data[offset] * alpha;
          sumG += data[offset + 1] * alpha;
          sumB += data[offset + 2] * alpha;
          count++;
        }
      }

      const out = (dy * size + dx) * 4;
      if (sumAlpha === 0) continue; // bloc transparent : laisse 0,0,0,0
      grid[out] = Math.round(sumR / sumAlpha);
      grid[out + 1] = Math.round(sumG / sumAlpha);
      grid[out + 2] = Math.round(sumB / sumAlpha);
      grid[out + 3] = Math.round(sumAlpha / count);
    }
  }

  return grid;
}

/**
 * Convertit des pixels bruts en grille 16×16, ou `null` si la donnée est
 * incohérente (dimensions nulles ou longueur d'octets incorrecte).
 */
export function imageDataToGrid(image: ImageDataLike): PixelGrid | null {
  const { data, width, height } = image;
  if (width <= 0 || height <= 0) return null;
  if (data.length !== width * height * 4) return null;
  // Source déjà 16×16 : recopie fidèle, sans ré-échantillonnage.
  if (width === GRID_SIZE && height === GRID_SIZE) return new Uint8ClampedArray(data);
  return alphaBoxDownscale(image, GRID_SIZE);
}
