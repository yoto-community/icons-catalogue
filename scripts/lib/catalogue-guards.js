/**
 * Garde-fous de cohérence du catalogue, appliqués par `build-api.js` **avant**
 * d'écrire `dist/` et `site/public/`.
 *
 * Motif : l'ancien `loadJSON()` renvoyait `[]` quand un fichier de source
 * manquait, en se contentant d'un avertissement. Un run hebdomadaire où un
 * scraper échouait écrasait alors `site/public/` par un catalogue amputé,
 * committé et déployé. Ces garde-fous transforment ces cas en échec explicite.
 */

/** Sources attendues dans le catalogue. */
export const DEFAULT_SOURCES = ['yotopixels', 'yotoicons', 'yoto-official'];

/** Décroissance maximale tolérée par rapport au build précédent (5 %). */
export const MAX_SHRINK_RATIO = 0.05;

/**
 * Vérifie que chaque source attendue est présente et non vide.
 *
 * @param {Record<string, number>} countsBySource - Nombre d'icônes par source.
 * @param {string[]} [sources] - Sources attendues.
 * @throws {Error} Liste les sources manquantes ou vides.
 */
export function assertSourcesPresent(countsBySource, sources = DEFAULT_SOURCES) {
  const missing = sources.filter((source) => !countsBySource[source] || countsBySource[source] <= 0);
  if (missing.length > 0) {
    throw new Error(
      `Sources manquantes ou vides : ${missing.join(', ')}. ` +
        'Relancez le(s) scraper(s) concerné(s) avant le build.'
    );
  }
}

/**
 * Vérifie que le total ne régresse pas au-delà d'une tolérance.
 *
 * @param {number} currentTotal
 * @param {number} [previousTotal] - Total du build précédent (`0`/absent = pas de référence).
 * @param {{ maxShrink?: number }} [options]
 * @throws {Error} Si la chute dépasse `maxShrink`.
 */
export function assertNoRegression(currentTotal, previousTotal, options = {}) {
  const maxShrink = options.maxShrink ?? MAX_SHRINK_RATIO;
  if (!previousTotal || previousTotal <= 0) return;

  const floor = Math.floor(previousTotal * (1 - maxShrink));
  if (currentTotal < floor) {
    throw new Error(
      `Le catalogue a chuté de ${previousTotal} à ${currentTotal} icônes ` +
        `(baisse maximale tolérée : ${Math.round(maxShrink * 100)} %).`
    );
  }
}
