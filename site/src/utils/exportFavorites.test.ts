import { describe, it, expect, vi } from 'vitest';
import type { Icon } from '../types';
import {
  safeFileName,
  extensionFromUrl,
  buildFavoritesArchive,
  downloadBytes,
} from './exportFavorites';

function icon(overrides: Partial<Icon> = {}): Icon {
  return {
    id: 'yi-alice-1',
    source: 'yotoicons',
    tags: ['chat'],
    artist: '@alice',
    title: 'Un chat noir',
    preview_image: 'https://cdn.example.com/a.png',
    download_url: 'https://cdn.example.com/a.png',
    category: 'animaux',
    subcategory: 'chat',
    downloads: 3,
    date_added: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Lit les entrées d'une archive (central directory). */
function readEntries(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const names: string[] = [];
  const dataByName = new Map<string, Uint8Array>();

  for (let i = 0; i < count; i++) {
    const size = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.slice(p + 46, p + 46 + nameLen));

    const localNameLen = view.getUint16(localOffset + 26, true);
    const dataStart = localOffset + 30 + localNameLen;
    names.push(name);
    dataByName.set(name, bytes.slice(dataStart, dataStart + size));
    p += 46 + nameLen;
  }

  return { count, names, dataByName };
}

const decoder = new TextDecoder();

describe('safeFileName', () => {
  it('retire les accents et normalise les caractères interdits', () => {
    expect(safeFileName('Étoile / Lune', 'png', 0)).toBe('001-etoile-lune.png');
  });

  it('préfixe avec un index pour garantir l’unicité', () => {
    expect(safeFileName('chat', 'png', 41)).toBe('042-chat.png');
  });

  it('retombe sur « icon » quand le titre est vide ou symbolique', () => {
    expect(safeFileName('', 'png', 0)).toBe('001-icon.png');
    expect(safeFileName('###', 'png', 0)).toBe('001-icon.png');
  });
});

describe('extensionFromUrl', () => {
  it('déduit l’extension du chemin', () => {
    expect(extensionFromUrl('https://x/a.svg')).toBe('svg');
    expect(extensionFromUrl('https://x/a.JPEG')).toBe('jpeg');
  });

  it('ignore la requête et retombe sur png', () => {
    expect(extensionFromUrl('https://x/a.png?w=64')).toBe('png');
    expect(extensionFromUrl('https://x/image')).toBe('png');
  });
});

describe('buildFavoritesArchive', () => {
  const now = new Date('2024-05-06T07:08:09');

  it('archive les images récupérées et un manifeste', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    })) as unknown as typeof fetch;

    const result = await buildFavoritesArchive([icon()], { fetchImpl, now });
    const { count, names, dataByName } = readEntries(result.bytes);

    expect(result.included).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.filename).toBe('yoto-favorites.zip');
    expect(count).toBe(3);
    expect(names).toContain('icons/001-un-chat-noir.png');
    expect(names).toContain('favorites.json');
    expect(names).toContain('README.txt');

    const manifest = JSON.parse(decoder.decode(dataByName.get('favorites.json')));
    expect(manifest).toHaveLength(1);
    expect(manifest[0]).toMatchObject({ id: 'yi-alice-1', title: 'Un chat noir' });
  });

  it('compte les images en échec sans interrompre l’archive', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('missing')) throw new Error('réseau');
      return {
        ok: true,
        status: 200,
        arrayBuffer: async () => new Uint8Array([9]).buffer,
      };
    }) as unknown as typeof fetch;

    const result = await buildFavoritesArchive(
      [
        icon({ id: 'ok', download_url: 'https://cdn.example.com/ok.png' }),
        icon({ id: 'ko', download_url: 'https://cdn.example.com/missing.png' }),
      ],
      { fetchImpl, now }
    );

    expect(result.included).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('traite une réponse HTTP non OK comme un échec', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
      status: 404,
      arrayBuffer: async () => new ArrayBuffer(0),
    })) as unknown as typeof fetch;

    const result = await buildFavoritesArchive([icon()], { fetchImpl, now });

    expect(result.included).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('ignore les icônes sans URL exploitable sans les requêter', async () => {
    const fetchImpl = vi.fn();

    const result = await buildFavoritesArchive([icon({ preview_image: '', download_url: '' })], {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now,
    });

    expect(result.included).toBe(0);
    expect(result.skipped).toBe(1);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('résout les URLs relatives via normalizeUrl', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => new ArrayBuffer(0),
    })) as unknown as typeof fetch;

    await buildFavoritesArchive(
      [icon({ source: 'yotopixels', preview_image: '/icons/x.png', download_url: '' })],
      { fetchImpl, now }
    );

    expect(fetchImpl).toHaveBeenCalledWith('https://yotopixels.com/icons/x.png');
  });

  it('produit une archive valide même sans icône', async () => {
    const result = await buildFavoritesArchive([], { now });
    const { count, names } = readEntries(result.bytes);

    expect(count).toBe(2);
    expect(names).toEqual(['favorites.json', 'README.txt']);
  });
});

describe('downloadBytes', () => {
  it('déclenche un téléchargement puis libère l’URL objet', () => {
    const createObjectURL = vi.fn(() => 'blob:fake');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadBytes(new Uint8Array([1, 2, 3]), 'yoto-favorites.zip');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake');

    click.mockRestore();
    vi.unstubAllGlobals();
  });
});
