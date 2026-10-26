/**
 * Parsing et normalisation des icônes yotopixels.
 *
 * Le site `yotopixels.com` sert une page `/search` rendue par SvelteKit : la
 * liste des icônes est **embarquée** dans un script `__sveltekit_*.start({ … })`
 * dont les clés ne sont pas citées (JSON non strict), avec des virgules finales
 * (`convertJSArrayToJSON` les rattrape). Un repli HTML existe pour les pages où
 * le script n'est pas exploitable.
 *
 * Ce module isole la logique pure (parsing + mapping), testée hors-ligne sur
 * fixtures (`yotopixels.test.js`) — aucune I/O, aucun réseau.
 */

import * as cheerio from 'cheerio';
import { inferTags } from './inferTags.js';
import { inferCategory, inferSubcategory } from './taxonomy.js';
import { licenseForSource } from './source-licenses.js';
import { isContentId, CONTENT_ID_RE } from './content-id.js';

/** Origine du site (préfixe des URLs relatives du repli HTML). */
export const YOTOPIXELS_BASE_URL = 'https://yotopixels.com';

/** Motif du tableau `data: […]` passé à `kit.start(…)`. */
const SVELTEKIT_START_RE = /kit\.start\s*\([^)]*data\s*:\s*(\[[\s\S]*?\])\s*,?\s*form:/;

/**
 * Convertit un littéral JS « souple » (clés non citées, virgules finales) en
 * JSON strict, sans toucher aux deux-points situés **dans** les chaînes.
 *
 * @param {string} jsArrayStr
 * @returns {string}
 */
export function convertJSArrayToJSON(jsArrayStr) {
  return String(jsArrayStr)
    .replace(/"(?:[^"\\]|\\.)*"/g, (match) => match.replace(/:/g, '\u0001'))
    .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '"$1":')
    .replace(/\u0001/g, ':')
    .replace(/,(\s*[}\]])/g, '$1');
}

/**
 * Extrait le tableau `data.icons` embarqué dans un script SvelteKit.
 *
 * @param {string} content - Contenu du script (sans balises).
 * @returns {Array<object>} Icônes brutes, ou `[]` si la forme attendue est absente.
 */
export function extractIconsFromSvelteKitScript(content) {
  try {
    const match = String(content).match(SVELTEKIT_START_RE);
    if (!match) return [];

    const dataArray = JSON.parse(convertJSArrayToJSON(match[1]));
    for (const item of dataArray) {
      if (item && item.type === 'data' && item.data && Array.isArray(item.data.icons)) {
        return item.data.icons;
      }
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Repli : extrait les icônes des cartes `article` de la page liste.
 *
 * @param {string} html
 * @returns {Array<object>} Icônes brutes.
 */
export function parseIconsFromHtml(html) {
  const $ = cheerio.load(html);
  const icons = [];

  $('article a[href^="/icon/"]').each((_, element) => {
    const $article = $(element).closest('article');
    const imageUrl = $article.find('img').attr('src') || '';
    const title = $article.find('h2').text().trim() || 'Sans titre';
    const href = $(element).attr('href') || '';
    const idMatch = href.match(/\/icon\/([a-f0-9-]+)/);
    const id = idMatch ? idMatch[1] : '';

    if (id && imageUrl) {
      icons.push({
        id,
        title,
        image_url: imageUrl.startsWith('http') ? imageUrl : `${YOTOPIXELS_BASE_URL}${imageUrl}`,
        creator: { id: 'yoto-pixels', public_alias: 'YotoPixels' },
        download_count: 0,
        tags: [],
        created_at: new Date().toISOString(),
        removed: false,
      });
    }
  });

  return icons;
}

/**
 * Extrait les icônes d'une page `/search` : script SvelteKit en priorité,
 * repli cartes `article` sinon.
 *
 * @param {string} html
 * @returns {Array<object>} Icônes brutes.
 */
export function extractIconsFromHtml(html) {
  const $ = cheerio.load(html);

  for (const script of $('script').toArray()) {
    const content = $(script).html() || '';
    if (content.includes('__sveltekit_') && content.includes('icons')) {
      const icons = extractIconsFromSvelteKitScript(content);
      if (icons.length > 0) return icons;
    }
  }

  return parseIconsFromHtml(html);
}

/**
 * Transforme une icône brute yotopixels en icône normalisée du catalogue.
 *
 * L'`id` **canonique** est l'identifiant de **contenu** `base64url(sha256(bytes
 * de l'image))`, calculé par le scraper (orchestration réseau) puis injecté :
 * une icône n'a pas d'`id` sans le hash de son image (cf.
 * `docs/analyse-id-sha256.md` §4.3 — pas d'id provisoire). L'identifiant natif
 * est conservé dans `metadata.source_id`.
 *
 * Les tags fournis par l'API sont conservés tels quels ; à défaut (ou pour le
 * repli HTML), ils sont inférés depuis le titre.
 *
 * @param {object} icon - Icône brute (`extractIconsFromHtml`).
 * @param {{contentId: string}} options - `contentId` = hash de contenu de l'image.
 * @returns {object} Icône au schéma commun.
 * @throws {Error} Si `contentId` est absent ou mal formé.
 */
export function toNormalizedIcon(icon, { contentId } = {}) {
  if (!isContentId(contentId)) {
    throw new Error(
      'toNormalizedIcon (yotopixels) : `contentId` requis — identifiant de contenu ' +
        `base64url(sha256(image)), 43 caractères (${CONTENT_ID_RE}). Reçu ` +
        `${JSON.stringify(contentId)}. Téléchargez d'abord l'image (lib/image-hash.js).`
    );
  }

  const apiTags = Array.isArray(icon.tags) ? icon.tags : [];
  const tags = apiTags.length > 0 ? apiTags : inferTags(icon.title);

  return {
    id: contentId,
    source: 'yotopixels',
    tags,
    artist: icon.creator?.public_alias || icon.creator?.id || 'anonymous',
    title: icon.title || 'Sans titre',
    preview_image: icon.image_url,
    download_url: icon.image_url,
    category: inferCategory(icon.title, tags),
    subcategory: inferSubcategory(icon.title, tags),
    downloads: icon.download_count || 0,
    date_added: icon.created_at,
    license: licenseForSource('yotopixels'),
    metadata: {
      source_id: icon.id,
      original_id: icon.id,
      creator_id: icon.creator?.id,
      content_encoding: 'base64url',
    },
  };
}

/**
 * Applique {@link toNormalizedIcon} à tout un lot.
 *
 * `contentIdFor` fournit, pour chaque icône brute, son identifiant de contenu
 * (typiquement résolu en amont par le scraper via `lib/image-hash.js`).
 *
 * @param {Array<object>} icons
 * @param {{contentIdFor?: (icon: object) => string}} [options]
 * @returns {Array<object>}
 */
export function toNormalizedIcons(icons, { contentIdFor } = {}) {
  return icons.map((icon) =>
    toNormalizedIcon(icon, { contentId: contentIdFor ? contentIdFor(icon) : undefined })
  );
}
