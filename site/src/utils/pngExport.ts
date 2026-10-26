/**
 * Encodage PNG 16×16 RGBA — sans dépendance (L1).
 *
 * Même philosophie que l'écrivain ZIP maison (`utils/zip.ts`) : plutôt que de
 * dépendre de `canvas.toBlob` (indisponible en jsdom et tributaire d'un moteur
 * de rendu), on **écrit le PNG à la main**. Le flux est parfaitement
 * spécifié et minuscule pour une icône :
 *   signature + IHDR + IDAT (zlib « stored ») + IEND.
 *
 * L'IDAT utilise des blocs deflate **non compressés** (BTYPE=00) : une icône
 * 16×16 pèse ~1 Ko, le gain d'une compression réelle est marginal et le coût
 * (dépendance/async) ne le justifie pas. La sortie reste un PNG valide lu par
 * tous les décodeurs (vérifié avec ImageMagick/PIL).
 */

import { BYTES_PER_PIXEL, GRID_SIZE } from '../constants/editor';
import type { PixelGrid } from './pixelEditor';
import { crc32 } from './zip';

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Filtre « None » : une ligne = 1 octet de filtre + les pixels RGBA. */
const ROW_STRIDE = 1 + GRID_SIZE * BYTES_PER_PIXEL;

/** Somme de contrôle Adler-32 (RFC 1950), requise par l'en-tête zlib. */
function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** Sérialise un chunk PNG (longueur BE, type, données, CRC du type+données). */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length, false);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)), false);
  return out;
}

/** Construit le flux zlib (en-tête + bloc « stored » + Adler-32). */
function zlibStore(data: Uint8Array): Uint8Array {
  // Une icône 16×16 tient en ~1 Ko : un unique bloc deflate non compressé
  // (BTYPE=00, BFINAL=1) suffit largement (limite de 65 535 octets/bloc).
  const out = new Uint8Array(2 + 5 + data.length + 4);
  out[0] = 0x78; // CMF : deflate, fenêtre 32K
  out[1] = 0x01; // FLG : niveau le plus rapide
  out[2] = 1; // BFINAL=1, BTYPE=00 (alignés sur l'octet)
  out[3] = data.length & 0xff;
  out[4] = (data.length >>> 8) & 0xff;
  out[5] = ~data.length & 0xff;
  out[6] = (~data.length >>> 8) & 0xff;
  out.set(data, 7);

  new DataView(out.buffer).setUint32(7 + data.length, adler32(data), false);
  return out;
}

/** Concatène les scanlines filtrées (« None ») de la grille. */
function buildScanlines(grid: PixelGrid): Uint8Array {
  const raw = new Uint8Array(GRID_SIZE * ROW_STRIDE);
  for (let y = 0; y < GRID_SIZE; y++) {
    const rowStart = y * GRID_SIZE * BYTES_PER_PIXEL;
    raw.set(grid.subarray(rowStart, rowStart + GRID_SIZE * BYTES_PER_PIXEL), y * ROW_STRIDE + 1);
  }
  return raw;
}

/** Encode une grille en PNG (octets complets, signature incluse). */
export function encodePng(grid: PixelGrid): Uint8Array {
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, GRID_SIZE, false);
  view.setUint32(4, GRID_SIZE, false);
  ihdr[8] = 8; // profondeur de bits
  ihdr[9] = 6; // type couleur : RGBA
  ihdr[10] = 0; // méthode de compression
  ihdr[11] = 0; // méthode de filtre
  ihdr[12] = 0; // entrelacement

  const parts = [
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlibStore(buildScanlines(grid))),
    chunk('IEND', new Uint8Array(0)),
  ];

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

/** Enveloppe le PNG dans un `Blob` prêt à télécharger. */
export function createPngBlob(grid: PixelGrid): Blob {
  // Copie explicite : garantit un `Uint8Array<ArrayBuffer>` accepté comme
  // `BlobPart` (un `Uint8Array` générique peut porter un `SharedArrayBuffer`).
  return new Blob([new Uint8Array(encodePng(grid))], { type: 'image/png' });
}

/**
 * Encode la grille en **data URL** `data:image/png;base64,…`.
 *
 * Utilisé pour l'aperçu et le téléchargement : `URL.createObjectURL` n'existe
 * pas en jsdom, et une data URL évite toute fuite de ressource (pas de
 * `revokeObjectURL` à gérer). L'icône pèse ~1 Ko, la taille est négligeable.
 */
export function encodePngDataUrl(grid: PixelGrid): string {
  const bytes = encodePng(grid);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return `data:image/png;base64,${btoa(binary)}`;
}
