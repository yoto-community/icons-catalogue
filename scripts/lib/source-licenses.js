/**
 * Source unique de vérité des licences par source de catalogue.
 *
 * Chaque icône publiée porte un champ `license`, appliqué depuis cette table au
 * moment du build. Cela remplace la valeur `CC-BY-SC` qui était codée en dur
 * dans le scraper yotopixels : ce n'est **pas** un identifiant de licence valide
 * (absent de Creative Commons comme de SPDX) et elle divergeait de l'UI de
 * l'application, qui cite `CC-BY-SA`.
 *
 * Choix `yotopixels = CC-BY-SA` : yotopixels.com ne publie **aucune licence
 * explicite** (aucune mention sur l'accueil, la recherche, les pages d'icône, la
 * politique de confidentialité ; `/about` et `/terms` renvoient 404). En
 * l'absence de licence contraire et au vu de son intention de partage
 * communautaire (outil gratuit, icônes partagées), la valeur retenue est
 * `CC-BY-SA`, déjà citée par l'UI du catalogue. **À confirmer auprès de l'auteur
 * de yotopixels.**
 */

/** Licences canoniques par source. */
export const SOURCE_LICENSES = Object.freeze({
  yotopixels: 'CC-BY-SA',
  yotoicons: 'CC-BY-NC',
  'yoto-official': 'Yoto Official',
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
