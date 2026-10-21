import type { Icon } from '../types';
import { normalizeUrl } from './iconUtils';
import { createZip, type ZipEntry } from './zip';

const KNOWN_EXTENSIONS = ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'];

/** Nom de fichier sûr pour un ZIP : sans accent, minuscule, indexé. */
export function safeFileName(title: string, ext: string, index: number): string {
  const base =
    title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50) || 'icon';
  const prefix = String(index + 1).padStart(3, '0');
  return `${prefix}-${base}.${ext}`;
}

/** Déduit l'extension d'une URL d'image, avec repli sur `png`. */
export function extensionFromUrl(url: string): string {
  const match = url.match(/\.([a-z0-9]{2,4})(?:[?#]|$)/i);
  const ext = match?.[1]?.toLowerCase();
  return ext && KNOWN_EXTENSIONS.includes(ext) ? ext : 'png';
}

export interface FavoritesArchive {
  /** Nom du fichier proposé au téléchargement. */
  filename: string;
  /** Contenu binaire du ZIP. */
  bytes: Uint8Array;
  /** Nombre d'images récupérées. */
  included: number;
  /** Nombre d'images ignorées (réseau / 404). */
  skipped: number;
}

export interface BuildArchiveOptions {
  fetchImpl?: typeof fetch;
  now?: Date;
}

function readmeText(total: number, included: number, skipped: number): string {
  return [
    'Yoto Icons Catalogue — export des favoris',
    '',
    `Icônes favorites : ${total}`,
    `Images incluses : ${included}`,
    skipped > 0 ? `Images indisponibles (non incluses) : ${skipped}` : null,
    '',
    'Contenu : dossier « icons/ » (images) et « favorites.json » (métadonnées).',
    '',
    'Attribution : les icônes restent la propriété de leurs auteurs (yotopixels,',
    'yotoicons) ou de Yoto. Consultez le champ « license » de chaque icône dans',
    'favorites.json avant toute réutilisation.',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

/**
 * Construit une archive ZIP des icônes favorites (P3.2) : images récupérées
 * depuis leurs sources + `favorites.json` (métadonnées) + `README.txt`.
 *
 * Une image inaccessible est ignorée (`skipped`) sans faire échouer l'archive.
 * `fetchImpl` / `now` sont injectables pour les tests.
 */
export async function buildFavoritesArchive(
  icons: Icon[],
  { fetchImpl = fetch, now = new Date() }: BuildArchiveOptions = {}
): Promise<FavoritesArchive> {
  const encoder = new TextEncoder();
  const entries: ZipEntry[] = [];
  const manifest: Array<Record<string, unknown>> = [];
  let included = 0;
  let skipped = 0;

  for (let index = 0; index < icons.length; index++) {
    const icon = icons[index];
    const url = normalizeUrl(icon.download_url || icon.preview_image, icon.source);
    manifest.push({
      id: icon.id,
      title: icon.title,
      artist: icon.artist,
      source: icon.source,
      category: icon.category,
      subcategory: icon.subcategory,
      tags: icon.tags,
      license: icon.license ?? null,
      url,
    });

    // Sans URL exploitable, inutile de requêter (et `fetch('')` viserait la
    // page courante) : l'icône reste dans le manifeste mais sans image.
    if (!url) {
      skipped++;
      continue;
    }

    try {
      const response = await fetchImpl(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = await response.arrayBuffer();
      const ext = extensionFromUrl(url);
      entries.push({
        name: `icons/${safeFileName(icon.title, ext, index)}`,
        data: new Uint8Array(buffer),
      });
      included++;
    } catch {
      skipped++;
    }
  }

  entries.push({
    name: 'favorites.json',
    data: encoder.encode(JSON.stringify(manifest, null, 2)),
  });
  entries.push({
    name: 'README.txt',
    data: encoder.encode(readmeText(icons.length, included, skipped)),
  });

  return {
    filename: 'yoto-favorites.zip',
    bytes: createZip(entries, now),
    included,
    skipped,
  };
}

/** Déclenche le téléchargement d'un blob binaire et libère l'URL objet. */
export function downloadBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
