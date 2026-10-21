/**
 * Détection de doublons **inter-sources** (P1.4).
 *
 * Aucun doublon par `id`/`download_url`/`preview_image` n'existe dans les
 * données brutes, mais un même visuel peut être présent dans plusieurs sources
 * avec des URLs différentes (ex. les emoji noto de `yotoicons` re-uploadés dans
 * `yoto-official`).
 *
 * Enquête (2026-10-21) : la clé « titre + artiste normalisés » ne détecte
 * **aucun** doublon (les artistes différent structurellement d'une source à
 * l'autre : `Yoto`, `@pseudo`…). On retient donc « titre normalisé +
 * catégorie », en n'acceptant que les groupes où chaque source apparaît au plus
 * `maxPerSource` fois : la contrainte écarte les blocs ambigus (ex. 70 icônes
 * `yotoicons` intitulées « dog ») et ne conserve que les correspondances
 * précises — 45 groupes sur le catalogue réel (2026-10-21).
 *
 * La logique est pure (aucune E/S) et testée sans réseau (`dedupe.test.js`).
 */

/**
 * Ordre de priorité des sources pour choisir l'icône « canonique » d'un groupe.
 * L'icône officielle Yoto prime (référence curatée), puis yotopixels, puis
 * yotoicons.
 */
export const SOURCE_PRIORITY = ['yoto-official', 'yotopixels', 'yotoicons'];

/** Rang de priorité d'une source (rang le plus élevé = le plus prioritaire). */
function priorityIndex(source) {
  const index = SOURCE_PRIORITY.indexOf(source);
  return index === -1 ? SOURCE_PRIORITY.length : index;
}

/**
 * Normalise un titre pour comparaison : minuscules, accents retirés,
 * ponctuation remplacée par des espaces, espaces multiples compactés.
 *
 * @param {unknown} title
 * @returns {string}
 */
export function normalizeTitle(title) {
  return String(title ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Regroupe les icônes par clé « titre normalisé + catégorie » et ne conserve
 * que les groupes **inter-sources** non ambigus.
 *
 * @param {Array<object>} icons
 * @param {{maxPerSource?: number}} [options]
 * @returns {Array<{key: string, members: Array<object>}>}
 */
export function findCrossSourceDuplicates(icons, { maxPerSource = 1 } = {}) {
  const byKey = new Map();
  for (const icon of icons) {
    const normalized = normalizeTitle(icon.title);
    if (!normalized) continue;
    const key = `${normalized}|${icon.category}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(icon);
  }

  const groups = [];
  for (const [key, members] of byKey) {
    const perSource = new Map();
    for (const member of members) {
      perSource.set(member.source, (perSource.get(member.source) || 0) + 1);
    }
    // Inter-sources seulement, et sans bloc ambigu au sein d'une source.
    if (perSource.size < 2) continue;
    if ([...perSource.values()].some((count) => count > maxPerSource)) continue;
    groups.push({ key, members });
  }
  return groups;
}

/**
 * Détermine les doublons et l'icône canonique de chaque groupe.
 *
 * @param {Array<object>} icons
 * @param {{maxPerSource?: number}} [options]
 * @returns {{
 *   groups: Array<{key: string, title: string, canonicalId: string, ids: string[]}>,
 *   duplicateOf: Map<string, string>
 * }}
 */
export function markDuplicates(icons, options) {
  const found = findCrossSourceDuplicates(icons, options);
  const duplicateOf = new Map();

  const groups = found.map(({ key, members }) => {
    const ordered = [...members].sort(
      (a, b) =>
        priorityIndex(a.source) - priorityIndex(b.source) ||
        (b.downloads || 0) - (a.downloads || 0) ||
        String(a.id).localeCompare(String(b.id))
    );
    const canonical = ordered[0];
    for (const duplicate of ordered.slice(1)) {
      duplicateOf.set(duplicate.id, canonical.id);
    }
    return {
      key,
      title: canonical.title,
      canonicalId: canonical.id,
      ids: ordered.map((member) => member.id),
    };
  });

  return { groups, duplicateOf };
}
