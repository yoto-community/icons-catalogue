import { describe, it, expect } from 'vitest';
import { crc32, createZip } from './zip';

const encoder = new TextEncoder();

/** Lit l'End Of Central Directory (signature 0x06054b50). */
function findEocd(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      return {
        count: view.getUint16(i + 10, true),
        cdSize: view.getUint32(i + 12, true),
        cdOffset: view.getUint32(i + 16, true),
      };
    }
  }
  throw new Error('EOCD introuvable');
}

/** Parcourt l'annuaire central et renvoie les entrées décrites. */
function readEntries(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEocd(bytes);
  const entries: { name: string; crc: number; size: number; localOffset: number }[] = [];
  let p = eocd.cdOffset;

  for (let i = 0; i < eocd.count; i++) {
    if (view.getUint32(p, true) !== 0x02014b50) throw new Error('en-tête central invalide');
    const crc = view.getUint32(p + 16, true);
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.slice(p + 46, p + 46 + nameLen));
    entries.push({ name, crc, size, localOffset });
    p += 46 + nameLen;
  }

  return { eocd, entries };
}

function localHeader(bytes: Uint8Array, offset: number) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  expect(view.getUint32(offset, true)).toBe(0x04034b50);
  const nameLen = view.getUint16(offset + 26, true);
  const name = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + nameLen));
  return { name, dataStart: offset + 30 + nameLen };
}

describe('crc32', () => {
  it('calcule la valeur de contrôle connue de « 123456789 »', () => {
    expect(crc32(encoder.encode('123456789'))).toBe(0xcbf43926);
  });

  it('renvoie 0 pour un tableau vide', () => {
    expect(crc32(new Uint8Array())).toBe(0);
  });
});

describe('createZip', () => {
  const now = new Date('2024-05-06T07:08:09');

  it('produit une archive valide avec une entrée', () => {
    const data = encoder.encode('bonjour');
    const bytes = createZip([{ name: 'hello.txt', data }], now);
    const { eocd, entries } = readEntries(bytes);

    expect(eocd.count).toBe(1);
    expect(entries[0].name).toBe('hello.txt');
    expect(entries[0].size).toBe(data.length);
    expect(entries[0].crc).toBe(crc32(data));
  });

  it('écrit l’en-tête local correspondant à l’annuaire central', () => {
    const data = encoder.encode('contenu');
    const bytes = createZip([{ name: 'a.txt', data }], now);
    const { entries } = readEntries(bytes);

    const header = localHeader(bytes, entries[0].localOffset);
    expect(header.name).toBe('a.txt');
    // Les octets de données suivent immédiatement l'en-tête local.
    expect(Array.from(bytes.slice(header.dataStart, header.dataStart + data.length))).toEqual(
      Array.from(data)
    );
  });

  it('gère plusieurs entrées', () => {
    const bytes = createZip(
      [
        { name: 'a.txt', data: encoder.encode('a') },
        { name: 'b.txt', data: encoder.encode('bb') },
      ],
      now
    );
    const { eocd, entries } = readEntries(bytes);

    expect(eocd.count).toBe(2);
    expect(entries.map((e) => e.name)).toEqual(['a.txt', 'b.txt']);
    expect(entries.map((e) => e.size)).toEqual([1, 2]);
  });

  it('produit une archive vide valide', () => {
    const bytes = createZip([], now);
    const { eocd, entries } = readEntries(bytes);

    expect(eocd.count).toBe(0);
    expect(entries).toHaveLength(0);
  });

  it('préserve les noms de fichiers UTF-8 (accents)', () => {
    const bytes = createZip([{ name: 'étoile-lune.txt', data: encoder.encode('x') }], now);
    const { entries } = readEntries(bytes);

    expect(entries[0].name).toBe('étoile-lune.txt');
  });

  it('accepte des données binaires', () => {
    const data = new Uint8Array([0, 1, 2, 253, 254, 255]);
    const bytes = createZip([{ name: 'raw.bin', data }], now);
    const { entries } = readEntries(bytes);
    const header = localHeader(bytes, entries[0].localOffset);

    expect(entries[0].crc).toBe(crc32(data));
    expect(Array.from(bytes.slice(header.dataStart, header.dataStart + data.length))).toEqual(
      Array.from(data)
    );
  });
});
