/**
 * Contrôle de cohérence `data/` ↔ `site/public/summary.json` (P2.6).
 *
 * Depuis P1.5, le gros artefact (`icons.json`) n'est
 * plus versionné et est régénéré par `build:api` ; un « no diff » global est
 * donc impossible (et inutile). En revanche, `summary.json` **reste versionné**
 * (marqueur de version, cf. P1.7) : s'il n'est pas régénéré après une évolution
 * de `data/`, le catalogue publié et les compteurs divergent silencieusement.
 *
 * Ce module compare les **comptes** d'un résumé versionné et d'un résumé
 * fraîchement régénéré, en ignorant les champs volatils (`catalogVersion`,
 * `updatedAt`) — logique pure et testée (`summary-sync.test.js`).
 */

/** Objet simple (ni `null`, ni tableau, ni primitive). */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Sérialisation stable (clés triées) pour comparer sans dépendre de l'ordre. */
function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/** Champs de `counts` dont la dérive doit être détectée. */
const COUNT_KEYS = ['bySource', 'byCategory', 'byArtist', 'bySubcategory', 'topTags', 'topArtists'];

/**
 * Compare les comptes de deux résumés.
 *
 * @param {unknown} previous - Résumé versionné (avant régénération).
 * @param {unknown} current - Résumé régénéré.
 * @returns {{inSync: boolean, differences: string[]}}
 */
export function compareSummaryCounts(previous, current) {
  if (!isPlainObject(previous) || !isPlainObject(current)) {
    return { inSync: false, differences: ['résumé absent ou invalide'] };
  }

  const differences = [];

  if (previous.schemaVersion !== current.schemaVersion) {
    differences.push(`schemaVersion : ${previous.schemaVersion} → ${current.schemaVersion}`);
  }

  if (previous.total !== current.total) {
    differences.push(`total : ${previous.total} → ${current.total}`);
  }

  for (const key of COUNT_KEYS) {
    const before = stableStringify(previous.counts?.[key]);
    const after = stableStringify(current.counts?.[key]);
    if (before !== after) {
      differences.push(`counts.${key} : ${before} → ${after}`);
    }
  }

  if (stableStringify(previous.duplicates) !== stableStringify(current.duplicates)) {
    differences.push(
      `duplicates : ${stableStringify(previous.duplicates)} → ${stableStringify(current.duplicates)}`
    );
  }

  return { inSync: differences.length === 0, differences };
}
