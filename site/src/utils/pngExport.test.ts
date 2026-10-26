import { describe, it, expect } from 'vitest';
import { GRID_SIZE } from '../constants/editor';
import { createGrid, setPixel } from './pixelEditor';
import { createPngBlob, encodePng, encodePngDataUrl } from './pngExport';
import { crc32 } from './zip';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

interface Chunk {
  type: string;
  data: Uint8Array;
  crc: number;
  crcInput: Uint8Array;
}

/** Découpe un PNG en chunks (longueur, type, données, CRC). */
function parseChunks(bytes: Uint8Array): Chunk[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunks: Chunk[] = [];
  let offset = PNG_SIGNATURE.length;
  while (offset < bytes.length) {
    const length = view.getUint32(offset, false);
    const type = new TextDecoder().decode(bytes.slice(offset + 4, offset + 8));
    const data = bytes.slice(offset + 8, offset + 8 + length);
    chunks.push({
      type,
      data,
      crc: view.getUint32(offset + 8 + length, false),
      crcInput: bytes.slice(offset + 4, offset + 8 + length),
    });
    offset += 12 + length;
  }
  return chunks;
}

/** Reconstitue les scanlines filtrées (filtre « None » par ligne). */
function expectedRaw(grid: Uint8ClampedArray): Uint8Array {
  const stride = 1 + GRID_SIZE * 4;
  const raw = new Uint8Array(GRID_SIZE * stride);
  for (let y = 0; y < GRID_SIZE; y++) {
    raw[y * stride] = 0;
    raw.set(grid.subarray(y * GRID_SIZE * 4, (y + 1) * GRID_SIZE * 4), y * stride + 1);
  }
  return raw;
}

/** Somme de contrôle Adler-32 (RFC 1950), ré-implémentée indépendamment. */
function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/**
 * Décode l'IDAT produit par l'encodeur : en-tête zlib puis blocs deflate
 * « stored » (BTYPE=00). Vérifie au passage les invariants du flux.
 */
function inflateStored(zlib: Uint8Array): Uint8Array {
  expect(zlib[0]).toBe(0x78);
  expect(zlib[1]).toBe(0x01);

  const view = new DataView(zlib.buffer, zlib.byteOffset, zlib.byteLength);
  let offset = 2;
  const blocks: Uint8Array[] = [];
  let final = 0;

  while (final === 0) {
    const header = zlib[offset++];
    final = header & 1;
    expect(header & 0b110).toBe(0); // BTYPE=00 : bloc non compressé

    const length = zlib[offset] | (zlib[offset + 1] << 8);
    const nlength = zlib[offset + 2] | (zlib[offset + 3] << 8);
    expect(nlength ^ 0xffff).toBe(length);
    offset += 4;

    blocks.push(zlib.slice(offset, offset + length));
    offset += length;
  }

  const total = blocks.reduce((sum, block) => sum + block.length, 0);
  const raw = new Uint8Array(total);
  let cursor = 0;
  for (const block of blocks) {
    raw.set(block, cursor);
    cursor += block.length;
  }

  expect(view.getUint32(offset, false)).toBe(adler32(raw));
  return raw;
}

describe('encodePng', () => {
  it('écrit la signature PNG', () => {
    const bytes = encodePng(createGrid());
    expect(Array.from(bytes.slice(0, 8))).toEqual(PNG_SIGNATURE);
  });

  it('décrit un IHDR 16×16 RGBA 8 bits non entrelacé', () => {
    const chunks = parseChunks(encodePng(createGrid()));
    const ihdr = chunks[0];

    expect(ihdr.type).toBe('IHDR');
    const view = new DataView(ihdr.data.buffer, ihdr.data.byteOffset, ihdr.data.byteLength);
    expect(view.getUint32(0, false)).toBe(GRID_SIZE);
    expect(view.getUint32(4, false)).toBe(GRID_SIZE);
    expect(ihdr.data[8]).toBe(8); // profondeur
    expect(ihdr.data[9]).toBe(6); // type couleur RGBA
    expect(ihdr.data[10]).toBe(0); // compression
    expect(ihdr.data[11]).toBe(0); // filtre
    expect(ihdr.data[12]).toBe(0); // entrelacement
  });

  it('se compose de IHDR, IDAT et IEND', () => {
    const chunks = parseChunks(encodePng(createGrid()));
    expect(chunks.map((chunk) => chunk.type)).toEqual(['IHDR', 'IDAT', 'IEND']);
  });

  it('produit un CRC valide pour chaque chunk', () => {
    const chunks = parseChunks(encodePng(createGrid()));
    for (const chunk of chunks) {
      expect(chunk.crc).toBe(crc32(chunk.crcInput));
    }
  });

  it('restitue exactement les pixels dans l’IDAT (flux zlib valide)', () => {
    const grid = createGrid();
    setPixel(grid, 0, 0, [255, 0, 0, 255]);
    setPixel(grid, 5, 5, [0, 128, 255, 64]);
    setPixel(grid, GRID_SIZE - 1, GRID_SIZE - 1, [1, 2, 3, 255]);

    const chunks = parseChunks(encodePng(grid));
    const idat = chunks.find((chunk) => chunk.type === 'IDAT');
    const raw = inflateStored(idat!.data);

    expect(raw.length).toBe(GRID_SIZE * (1 + GRID_SIZE * 4));
    expect(Array.from(raw)).toEqual(Array.from(expectedRaw(grid)));
    // Toutes les lignes utilisent le filtre « None ».
    for (let y = 0; y < GRID_SIZE; y++) {
      expect(raw[y * (1 + GRID_SIZE * 4)]).toBe(0);
    }
  });
});

describe('createPngBlob', () => {
  it('renvoie un Blob image/png de la taille attendue', () => {
    const blob = createPngBlob(createGrid());
    expect(blob.type).toBe('image/png');
    expect(blob.size).toBe(encodePng(createGrid()).length);
  });
});

describe('encodePngDataUrl', () => {
  it('préfixe les octets par l’en-tête data URL image/png', () => {
    const dataUrl = encodePngDataUrl(createGrid());
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('encode exactement le même PNG que `encodePng`', () => {
    const grid = createGrid();
    setPixel(grid, 1, 1, [255, 0, 0, 255]);
    const base64 = encodePngDataUrl(grid).split(',')[1];

    expect(base64).toBe(btoa(String.fromCharCode(...encodePng(grid))));
  });
});

describe('taille de référence', () => {
  it('reste raisonnable pour une icône 16×16 (≤ 1,5 Ko)', () => {
    expect(encodePng(createGrid()).length).toBeLessThan(1536);
  });
});
