/**
 * Versionnage du catalogue.
 *
 * `build-api.js` générait toujours `YYYY.MM.DD-1` : deux builds le même jour
 * produisaient la **même** version, ce qui empêche tout client de détecter une
 * mise à jour (cache, PWA, consommateurs de l'API). On rend la version
 * strictement croissante en repartant de la dernière version publiée.
 */

/**
 * Formate une version `YYYY.MM.DD-<n>` (date en UTC, comme l'ancien code).
 *
 * @param {Date} [date]
 * @param {number} [sequence]
 * @returns {string}
 */
export function formatCatalogVersion(date = new Date(), sequence = 1) {
  const day = date.toISOString().slice(0, 10).replace(/-/g, '.');
  return `${day}-${sequence}`;
}

/**
 * Calcule la version suivante, strictement croissante.
 *
 * - même jour que la version précédente → compteur incrémenté ;
 * - autre jour (ou version illisible) → `-1`.
 *
 * @param {string|null|undefined} previousVersion
 * @param {Date} [now]
 * @returns {string}
 */
export function nextCatalogVersion(previousVersion, now = new Date()) {
  const day = now.toISOString().slice(0, 10).replace(/-/g, '.');

  if (typeof previousVersion === 'string' && previousVersion.startsWith(`${day}-`)) {
    const sequence = Number.parseInt(previousVersion.slice(day.length + 1), 10);
    if (Number.isInteger(sequence) && sequence > 0) {
      return formatCatalogVersion(now, sequence + 1);
    }
  }

  return formatCatalogVersion(now, 1);
}
