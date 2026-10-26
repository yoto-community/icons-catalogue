/**
 * Fusion canonique des doublons de **contenu** (SHA-256).
 * Décision figée le 2026-10-26.
 *
 * Contrairement à `dedupe.js` — doublons *visuels* rapprochés par titre +
 * catégorie, **non destructif** (badge « Doublon ») — ce module traite les
 * doublons **exacts** : quand l'`id` **est** `base64url(sha256(bytes))`, deux
 * images aux octets identiques portent le **même `id`** et ne peuvent donc pas
 * coexister (le schéma exige des `id` uniques). Une seule entrée est publiée
 * (la **canonique**) ; les autres sont retirées mais **tracées**.
 *
 * Logique pure (aucune E/S), testée hors-ligne (`content-dedupe.test.js`).
 */

import { SOURCE_PRIORITY } from './dedupe.js';

/** Rang de priorité d'une source (rang le plus faible = le plus prioritaire). */
function priorityIndex(source) {
  const index = SOURCE_PRIORITY.indexOf(source);
  return index === -1 ? SOURCE_PRIORITY.length : index;
}

/** Identifiant de contenu d'une icône (elle-même porte déjà le hash dans `id`). */
function contentKey(icon) {
  return String(icon?.id ?? '');
}

/** Identifiant natif de la source, utilisé comme départage déterministe. */
function sourceIdOf(icon) {
  return String(icon?.metadata?.source_id ?? icon?.id ?? '');
}

/**
 * Choisit la canonique d'un groupe de contenu identique.
 *
 * Ordre **déterministe** (indépendant de l'ordre d'entrée) :
 * 1. priorité de source (`yoto-official` > `yotopixels` > `yotoicons`) ;
 * 2. `downloads` décroissant ;
 * 3. `metadata.source_id` croissant.
 *
 * @param {Array<object>} members - Icônes partageant le même id de contenu (≥ 1).
 * @returns {object} L'icône canonique (membre d'origine, non copiée).
 */
export function pickCanonical(members) {
  return [...members].sort(
    (a, b) =>
      priorityIndex(a.source) - priorityIndex(b.source) ||
      (b.downloads || 0) - (a.downloads || 0) ||
      sourceIdOf(a).localeCompare(sourceIdOf(b))
  )[0];
}

/**
 * Applique la fusion canonique à un lot d'icônes **adressées par contenu**.
 *
 * Ne mute jamais les entrées : la canonique conservée est copiée et enrichie de
 * `metadata.merged_source_ids` / `metadata.merged_count`.
 *
 * @param {Array<object>} icons
 * @returns {{
 *   icons: Array<object>,          // une entrée par contenu unique
 *   groups: Array<{               // uniquement les contenus en collision
 *     contentId: string,
 *     canonicalId: string,
 *     sources: string[],
 *     sourceIds: string[],         // triés (déterminisme)
 *     count: number
 *   }>,
 *   merged: number                 // entrées retirées (total − contenus uniques)
 * }}
 */
export function mergeContentDuplicates(icons) {
  if (!Array.isArray(icons)) {
    return { icons: [], groups: [], merged: 0 };
  }

  const byContent = new Map();
  for (const icon of icons) {
    const key = contentKey(icon);
    if (!byContent.has(key)) byContent.set(key, []);
    byContent.get(key).push(icon);
  }

  const kept = [];
  const groups = [];
  let merged = 0;

  for (const [contentId, members] of byContent) {
    if (members.length === 1) {
      kept.push(members[0]);
      continue;
    }

    const canonical = pickCanonical(members);
    const others = members.filter((member) => member !== canonical);
    // Trié → sortie indépendante de l'ordre d'entrée (déterminisme).
    const sourceIds = members.map(sourceIdOf).sort((a, b) => a.localeCompare(b));

    kept.push({
      ...canonical,
      metadata: {
        ...(canonical.metadata || {}),
        merged_source_ids: sourceIds,
        merged_count: members.length,
      },
    });

    merged += others.length;
    groups.push({
      contentId,
      canonicalId: canonical.id,
      sources: [...new Set(members.map((member) => member.source))],
      sourceIds,
      count: members.length,
    });
  }

  return { icons: kept, groups, merged };
}
