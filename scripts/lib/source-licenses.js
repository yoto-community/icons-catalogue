/**
 * Source unique de vérité des licences/provenances par source de catalogue.
 *
 * Chaque icône publiée porte un champ `license`, appliqué depuis cette table au
 * moment du build.
 *
 * ⚠️ Ces valeurs **ne sont pas des identifiants SPDX/Creative Commons** : elles
 * décrivent la **provenance et les conditions réellement déclarées** par la
 * source. On n'affirme jamais une licence que la source n'a pas accordée.
 *
 * Vérification des licences réellement publiées par les sources
 * (pages publiques consultées le 2026-10-26) :
 *
 * - `yotopixels` : le site ne publie **aucune** licence ni CGU (`/terms` et
 *   `/about` renvoient 404 ; seul un *Privacy Policy* existe, sur les données
 *   personnelles). Une licence Creative Commons ne peut donc pas être affirmée
 *   au nom des auteurs → valeur retenue `Unspecified`.
 * - `yotoicons` : `/terms` publie des **conditions maison** qui rendent les
 *   icônes « available to everyone » (via yotoicons.com, l'API et yoto.space) et
 *   **autorisent l'usage commercial** par ces services. Ce n'est **pas**
 *   `CC-BY-NC` (qui interdirait l'usage commercial) → `Source terms`.
 * - `yoto-official` : les icônes sont du **contenu propriétaire Yoto** (API Terms
 *   of Service §6 : « all rights… remain with Yoto »). `Proprietary` décrit la
 *   provenance/le régime applicable, pas une licence accordée.
 */

/** Provenance/conditions canoniques par source. */
export const SOURCE_LICENSES = Object.freeze({
  yotopixels: 'Unspecified',
  yotoicons: 'Source terms',
  'yoto-official': 'Proprietary',
});

/** Valeur prudente pour une source non répertoriée. */
export const DEFAULT_LICENSE = 'Unknown';

/**
 * Renvoie la licence canonique d'une source.
 * @param {string} source
 * @returns {string}
 */
export function licenseForSource(source) {
  return SOURCE_LICENSES[source] ?? DEFAULT_LICENSE;
}

/**
 * Renvoie une copie de l'icône avec la licence canonique de sa source.
 * Ne mute pas l'entrée.
 * @param {{ source: string, [key: string]: unknown }} icon
 * @returns {object}
 */
export function applySourceLicense(icon) {
  return { ...icon, license: licenseForSource(icon.source) };
}
