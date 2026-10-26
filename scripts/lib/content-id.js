/**
 * Identifiant de **contenu** d'une icône : `base64url(sha256(bytes de l'image))`.
 *
 * Décision figée le 2026-10-26 : l'`id`
 * canonique d'une icône est le hash de son image (43 caractères base64url, sans
 * padding), et l'identifiant natif de la source est conservé dans
 * `metadata.source_id`.
 *
 * Logique pure (aucune E/S) : elle ne fait que hacher des octets déjà en
 * mémoire. Le téléchargement de l'image relève du scraper (`lib/image-hash.js`).
 * Tests hors-ligne : `content-id.test.js`.
 */

import crypto from 'node:crypto';

/**
 * Motif d'un identifiant de contenu : base64url sans padding, **43** caractères
 * (32 octets). **Distinct** de `SHA256_RE` (64 caractères hexadécimaux, réservé à
 * l'intégrité des artefacts de build dans `catalogue-schema.js`) : ne pas
 * réutiliser l'un pour l'autre.
 */
export const CONTENT_ID_RE = /^[A-Za-z0-9_-]{43}$/;

/**
 * Calcule l'identifiant de contenu d'une image.
 *
 * @param {Buffer|Uint8Array|string} bytes - Octets de l'image (ou contenu à hacher).
 * @returns {string} 43 caractères base64url.
 */
export function contentId(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('base64url');
}

/**
 * Pour `yoto-official`, le `mediaId` **est déjà** l'identifiant de contenu
 * (hash SHA-256 de l'image en base64url, vérifié 519/519) : aucune dérivation ni
 * téléchargement requis, on le retourne **verbatim** (préserve l'interopérabilité
 * `yoto:<media_id>`).
 *
 * @param {unknown} mediaId
 * @returns {string}
 */
export function contentIdFromMediaId(mediaId) {
  return String(mediaId);
}

/**
 * Convertit un identifiant de contenu base64url en hexadécimal (comparaison,
 * interop, debug).
 *
 * @param {string} id - Identifiant de contenu base64url (43 caractères).
 * @returns {string} 64 caractères hexadécimaux.
 */
export function contentIdToHex(id) {
  return Buffer.from(String(id), 'base64url').toString('hex');
}

/**
 * Vrai si la valeur est un identifiant de contenu bien formé (base64url, 43
 * caractères).
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isContentId(value) {
  return typeof value === 'string' && CONTENT_ID_RE.test(value);
}
