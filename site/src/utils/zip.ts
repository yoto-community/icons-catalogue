/**
 * Écrivain ZIP minimal, sans dépendance (P3.2).
 *
 * Méthode « store » (aucune compression) : les archives de favoris contiennent
 * des images déjà compressées (PNG), la compression apporterait peu et
 * alourdirait le bundle (budget 130 Ko). Le format produit est un ZIP standard
 * lisible par `unzip`/`7-Zip`/l'explorateur.
 */

/** Table CRC-32 (polynôme IEEE 802.3, réfléchi). */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

/** Calcule le CRC-32 d'un bloc d'octets. */
export function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** Concatène des blocs et écrit des entiers little-endian. */
class ByteWriter {
  private readonly chunks: Uint8Array[] = [];
  length = 0;

  push(bytes: Uint8Array): void {
    this.chunks.push(bytes);
    this.length += bytes.length;
  }

  u16(value: number): void {
    const buffer = new Uint8Array(2);
    new DataView(buffer.buffer).setUint16(0, value & 0xffff, true);
    this.push(buffer);
  }

  u32(value: number): void {
    const buffer = new Uint8Array(4);
    new DataView(buffer.buffer).setUint32(0, value >>> 0, true);
    this.push(buffer);
  }

  toUint8Array(): Uint8Array {
    const out = new Uint8Array(this.length);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

/** Encode une date en (heure, date) au format MS-DOS attendu par le ZIP. */
function dosDateTime(date: Date): { time: number; date: number } {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time: time & 0xffff, date: day & 0xffff };
}

/** Bit 11 : les noms de fichiers sont encodés en UTF-8. */
const UTF8_FLAG = 0x0800;

/**
 * Construit une archive ZIP (méthode store) à partir des entrées fournies.
 * `now` est injectable pour des tests déterministes.
 */
export function createZip(entries: ZipEntry[], now: Date = new Date()): Uint8Array {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(now);
  const local = new ByteWriter();
  const central = new ByteWriter();
  const localOffsets: number[] = [];

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    localOffsets.push(local.length);

    local.u32(0x04034b50); // signature d'en-tête local
    local.u16(20); // version requise (2.0)
    local.u16(UTF8_FLAG);
    local.u16(0); // méthode : store
    local.u16(time);
    local.u16(date);
    local.u32(crc);
    local.u32(entry.data.length); // taille compressée
    local.u32(entry.data.length); // taille non compressée
    local.u16(nameBytes.length);
    local.u16(0); // champ extra
    local.push(nameBytes);
    local.push(entry.data);
  }

  const centralOffset = local.length;

  entries.forEach((entry, index) => {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);

    central.u32(0x02014b50); // signature d'annuaire central
    central.u16(20); // version de création
    central.u16(20); // version requise
    central.u16(UTF8_FLAG);
    central.u16(0); // méthode : store
    central.u16(time);
    central.u16(date);
    central.u32(crc);
    central.u32(entry.data.length);
    central.u32(entry.data.length);
    central.u16(nameBytes.length);
    central.u16(0); // champ extra
    central.u16(0); // commentaire
    central.u16(0); // numéro de disque
    central.u16(0); // attributs internes
    central.u32(0); // attributs externes
    central.u32(localOffsets[index]);
    central.push(nameBytes);
  });

  const centralSize = central.length;

  const end = new ByteWriter();
  end.u32(0x06054b50); // signature de fin d'annuaire central
  end.u16(0); // numéro de disque
  end.u16(0); // disque de l'annuaire
  end.u16(entries.length);
  end.u16(entries.length);
  end.u32(centralSize);
  end.u32(centralOffset);
  end.u16(0); // longueur du commentaire

  const output = new Uint8Array(local.length + centralSize + end.length);
  output.set(local.toUint8Array(), 0);
  output.set(central.toUint8Array(), local.length);
  output.set(end.toUint8Array(), local.length + centralSize);
  return output;
}
