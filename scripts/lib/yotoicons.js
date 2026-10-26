/**
 * Parsing et normalisation des icônes yotoicons.
 *
 * Découverte clé (2026-10) : la page liste `/icons` embarque déjà, pour chaque
 * icône, un appel JavaScript `populate_icon_modal(id, catégorie, tag1, tag2,
 * auteur, téléchargements)`. L'ancien scraper l'ignorait et se rabattait sur le
 * `alt` de l'image (vide) → titre `icon-<id>`, tag unique `['icon']`,
 * catégorie systématiquement `objets`, et des URLs de téléchargement/détail
 * `/download/{id}` et `/icon/{id}` qui répondent en réalité **404**.
 *
 * Ce module isole la logique pure (parsing + mapping) pour la tester sans
 * réseau (`yotoicons.test.js`).
 */

import { inferCategory, inferSubcategory } from './taxonomy.js';
import { inferTags } from './inferTags.js';
import { licenseForSource } from './source-licenses.js';
import { isContentId, CONTENT_ID_RE } from './content-id.js';

const BASE_URL = 'https://www.yotoicons.com';

/**
 * Catégories sources yotoicons → catégories canoniques (`taxonomy.js`).
 *
 * Vocabulaire observé sur ~1250 icônes (stable) : animals, people, objects,
 * clothes, patterns, vehicles, food, plants, places, weather, space, buildings.
 */
export const SOURCE_CATEGORY_MAP = {
  animals: 'animaux',
  people: 'personnages',
  objects: 'objets',
  clothes: 'objets',
  patterns: 'formes',
  vehicles: 'transport',
  food: 'nourriture',
  plants: 'nature',
  places: 'nature',
  weather: 'nature',
  space: 'nature',
  buildings: 'batiments',
};

/**
 * Sous-catégorie canonique de repli par catégorie source, quand l'inférence
 * depuis le titre/tags ne conclut pas (les tags yotoicons sont surtout des
 * noms de franchises, peu descriptifs).
 */
export const SOURCE_SUBCATEGORY_MAP = {
  animals: 'animal',
  plants: 'plante',
  vehicles: 'vehicule',
  buildings: 'batiment',
  food: 'nourriture',
};

/** Capture les arguments (chaînes simples quotes) d'un appel `populate_icon_modal`. */
const ONCLICK_RE =
  /populate_icon_modal\(\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\)/;

const ONCLICK_RE_GLOBAL = new RegExp(ONCLICK_RE.source, 'g');

/**
 * URL de l'image d'une icône yotoicons depuis son id numérique.
 * @param {string|number} id
 * @returns {string}
 */
export function buildImageUrl(id) {
  return `${BASE_URL}/static/uploads/${id}.png`;
}

/**
 * Parse un attribut `onclick="populate_icon_modal(...)"`.
 * @param {string} onclick
 * @returns {{id:string, category:string, tag1:string, tag2:string, author:string, downloads:number}|null}
 */
export function parseIconOnClick(onclick) {
  if (typeof onclick !== 'string') return null;
  const match = ONCLICK_RE.exec(onclick);
  if (!match) return null;

  const [, id, category, tag1, tag2, author, downloads] = match;
  if (!/^\d+$/.test(id)) return null; // garde-fou : id numérique yotoicons

  return {
    id,
    category: category.trim(),
    tag1: tag1.trim(),
    tag2: tag2.trim(),
    author: author.trim(),
    downloads: Number.parseInt(downloads, 10) || 0,
  };
}

/**
 * Extrait toutes les fiches présentes dans le HTML d'une page liste.
 * @param {string} html
 * @returns {Array<ReturnType<typeof parseIconOnClick>>}
 */
export function parseIconsFromHtml(html) {
  if (typeof html !== 'string') return [];
  const icons = [];
  for (const match of html.matchAll(ONCLICK_RE_GLOBAL)) {
    const parsed = parseIconOnClick(match[0]);
    if (parsed) icons.push(parsed);
  }
  return icons;
}

/**
 * Construit le titre lisible : tag principal, sinon tag secondaire, sinon
 * repli `icon-<id>`.
 */
export function buildTitle(tag1, tag2, id) {
  const primary = (tag1 || tag2 || '').trim();
  return primary ? primary.slice(0, 80) : `icon-${id}`;
}

/**
 * Normalise les tags : tag1 + tag2 en minuscules, dédupliqués, complétés par la
 * catégorie source. Repli sur l'inférence depuis le titre quand aucun tag.
 */
export function buildTags(tag1, tag2, sourceCategory, title) {
  const raw = [tag1, tag2]
    .map((tag) => (tag || '').trim().toLowerCase())
    .filter(Boolean);

  if (raw.length === 0) return inferTags(title);

  const tags = new Set(raw);
  const category = (sourceCategory || '').trim().toLowerCase();
  if (category) tags.add(category);
  return [...tags];
}

/**
 * Mappe la catégorie source vers la catégorie canonique, avec repli sur le
 * classifieur par mots-clés si la source est inconnue.
 */
export function mapCategory(sourceCategory, title, tags) {
  const key = (sourceCategory || '').trim().toLowerCase();
  return SOURCE_CATEGORY_MAP[key] || inferCategory(title, tags);
}

/**
 * Détermine la sous-catégorie : inférence par mots-clés d'abord, puis repli sur
 * la catégorie source quand l'inférence reste générique (`autre`).
 */
export function mapSubcategory(sourceCategory, title, tags) {
  const inferred = inferSubcategory(title, tags);
  if (inferred !== 'autre') return inferred;
  const key = (sourceCategory || '').trim().toLowerCase();
  return SOURCE_SUBCATEGORY_MAP[key] || 'autre';
}

/**
 * Transforme une fiche parsée en icône normalisée du catalogue.
 *
 * L'`id` **canonique** est l'identifiant de **contenu** `base64url(sha256(bytes
 * de l'image))`, calculé par le scraper puis injecté : pas d'`id` sans le hash
 * de l'image (cf. `docs/analyse-id-sha256.md` §4.3). L'identifiant natif
 * numérique yotoicons est conservé dans `metadata.source_id`.
 *
 * @param {object} parsed - Sortie de {@link parseIconOnClick}.
 * @param {{contentId: string, scrapedAt?: string}} options - `contentId` = hash
 *   de contenu de l'image ; `scrapedAt` injectable pour des tests déterministes.
 * @returns {object} Icône au schéma commun.
 * @throws {Error} Si `contentId` est absent ou mal formé.
 */
export function toNormalizedIcon(
  parsed,
  { contentId, scrapedAt = new Date().toISOString() } = {}
) {
  if (!isContentId(contentId)) {
    throw new Error(
      'toNormalizedIcon (yotoicons) : `contentId` requis — identifiant de contenu ' +
        `base64url(sha256(image)), 43 caractères (${CONTENT_ID_RE}). Reçu ` +
        `${JSON.stringify(contentId)}. Téléchargez d'abord l'image (lib/image-hash.js).`
    );
  }

  const title = buildTitle(parsed.tag1, parsed.tag2, parsed.id);
  const tags = buildTags(parsed.tag1, parsed.tag2, parsed.category, title);
  const category = mapCategory(parsed.category, title, tags);
  const subcategory = mapSubcategory(parsed.category, title, tags);
  const imageUrl = buildImageUrl(parsed.id);
  const author = parsed.author || 'anonymous';
  const tagForDetail = parsed.tag1 || parsed.category || '';

  return {
    id: contentId,
    source: 'yotoicons',
    tags,
    artist: `@${author}`,
    title,
    preview_image: imageUrl,
    download_url: imageUrl,
    category,
    subcategory,
    downloads: parsed.downloads,
    date_added: scrapedAt,
    license: licenseForSource('yotoicons'),
    metadata: {
      source_id: parsed.id,
      numeric_id: parsed.id,
      source_category: parsed.category,
      detail_url: tagForDetail
        ? `${BASE_URL}/icons?tag=${encodeURIComponent(tagForDetail)}`
        : BASE_URL,
      content_encoding: 'base64url',
    },
  };
}
