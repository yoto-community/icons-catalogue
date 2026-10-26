/**
 * Parsing et normalisation des icônes officielles Yoto (source `yoto.dev`).
 *
 * Le site `yoto.dev` est un site Astro : la liste des icônes est embarquée dans
 * un bundle JS dont le nom contient un **hash de contenu**
 * (`/_astro/Icons.<hash>.js`) qui change à chaque redéploiement. Ce module
 * découvre donc l'URL du bundle depuis la page, au lieu de la coder en dur
 * (l'ancien scraper pointait une URL figée qui cassait à chaque mise à jour du
 * site). La logique pure est isolée ici pour être testée sans réseau
 * (`yoto-official.test.js`).
 */

import { inferCategory, inferSubcategory } from './taxonomy.js';
import { licenseForSource } from './source-licenses.js';
import { contentIdFromMediaId } from './content-id.js';

/** Page d'où part la découverte du bundle. */
export const YOTO_DEV_ICONS_PAGE = 'https://yoto.dev/icons/using-icons/';

/** Base CDN des médias officiels Yoto (quand l'entrée ne fournit pas d'`url`). */
export const BASE_CDN_URL = 'https://card-content.yotoplay.com/yoto/';

/**
 * Chemin d'un bundle d'icônes Astro : `/_astro/Icons.<hash>.js`.
 * Accepte la forme absolue (`/…`), relative (`./…`) ou une URL complète.
 */
const BUNDLE_RE = /(?:https?:\/\/[^\s"']+)?(?:\/|\.\/)?_astro\/Icons\.[A-Za-z0-9_~-]+\.js/;

/** Motif du JSON embarqué dans le bundle (`JSON.parse(\`…\`)`). */
const EMBEDDED_JSON_RE = /JSON\.parse\(`([^`]*)`\)/;

/**
 * Trouve l'URL absolue du bundle d'icônes à partir du HTML de la page.
 *
 * @param {string} html - HTML de {@link YOTO_DEV_ICONS_PAGE}.
 * @param {string} [pageUrl] - URL de la page (pour résoudre les chemins relatifs).
 * @returns {string|null} URL absolue, ou `null` si aucun bundle n'est trouvé.
 */
export function findBundleUrl(html, pageUrl = YOTO_DEV_ICONS_PAGE) {
  if (typeof html !== 'string') return null;
  const match = html.match(BUNDLE_RE);
  if (!match) return null;
  try {
    return new URL(match[0], pageUrl).href;
  } catch {
    return null;
  }
}

/**
 * Extrait le tableau d'icônes brutes embarqué dans le bundle JS.
 *
 * @param {string} bundleJs - Contenu du bundle (`Icons.<hash>.js`).
 * @returns {Array<object>} Icônes brutes (schéma yoto.dev).
 * @throws {Error} Si le motif attendu a disparu (structure du site modifiée).
 */
export function extractRawIcons(bundleJs) {
  const match = String(bundleJs).match(EMBEDDED_JSON_RE);
  if (!match) {
    throw new Error(
      "Impossible de trouver les données d'icônes dans le bundle JS (structure de yoto.dev modifiée ?)"
    );
  }

  const parsed = JSON.parse(match[1]);
  if (!Array.isArray(parsed)) {
    throw new Error("Les données d'icônes du bundle ne sont pas un tableau");
  }
  return parsed;
}

/**
 * Transforme une icône brute yoto.dev en icône normalisée du catalogue.
 *
 * Cas particulier : le `mediaId` officiel **est déjà** l'identifiant de contenu
 * (`base64url(sha256(bytes))`, vérifié 519/519). L'`id` est donc le `mediaId`
 * **verbatim** (aucun téléchargement, aucun préfixe) et
 * `metadata.source_id == metadata.media_id == id`.
 *
 * @param {object} raw
 * @param {string} [scrapedAt] - Horodatage ISO (injecté pour des tests déterministes).
 * @returns {object} Icône au schéma commun.
 */
export function toNormalizedIcon(raw, scrapedAt = new Date().toISOString()) {
  const mediaId = String(raw.mediaId);
  const id = contentIdFromMediaId(mediaId);
  const title = raw.title || 'Sans titre';
  const tags = Array.isArray(raw.publicTags) ? raw.publicTags : [];
  const imageUrl = raw.url || `${BASE_CDN_URL}${mediaId}`;

  return {
    id,
    source: 'yoto-official',
    tags,
    artist: 'Yoto',
    title,
    preview_image: imageUrl,
    download_url: imageUrl,
    category: inferCategory(title, tags),
    subcategory: inferSubcategory(title, tags),
    downloads: 0, // Pas de données de téléchargement pour les icônes officielles
    date_added: scrapedAt,
    license: licenseForSource('yoto-official'),
    metadata: {
      source_id: mediaId,
      media_id: mediaId,
      official: true,
      content_encoding: 'base64url',
    },
  };
}

/**
 * Normalise une liste d'icônes brutes en ignorant les entrées sans `mediaId`.
 *
 * @param {Array<object>} rawIcons
 * @param {string} [scrapedAt]
 * @returns {Array<object>}
 */
export function toNormalizedIcons(rawIcons, scrapedAt = new Date().toISOString()) {
  return rawIcons
    .filter((raw) => raw && raw.mediaId !== undefined && raw.mediaId !== null)
    .map((raw) => toNormalizedIcon(raw, scrapedAt));
}
