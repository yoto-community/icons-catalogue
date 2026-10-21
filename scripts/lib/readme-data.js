/**
 * Génération de la section « Données actuelles » du README depuis
 * `summary.json` (P0.5, reliquat). Pure : aucune E/S, donc testable et
 * réutilisable par le CLI de mise à jour et par le garde-fou de CI.
 *
 * La section est délimitée par son titre de niveau 2 et se termine au titre de
 * niveau 2 suivant ; `replaceDataSection` la remplace (ou l'insère avant
 * « ## Licence ») de façon idempotente.
 */

export const DATA_SECTION_HEADING = '## Données actuelles (dernier build)';

/** Ordre d'affichage canonique des sources (indépendant de l'ordre du JSON). */
const SOURCE_ORDER = ['yotopixels', 'yotoicons', 'yoto-official'];

/** Formate un entier avec un espace comme séparateur de milliers. */
export function formatCount(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function orderedSources(bySource = {}) {
  const known = SOURCE_ORDER.filter((source) => source in bySource);
  const extra = Object.keys(bySource)
    .filter((source) => !SOURCE_ORDER.includes(source))
    .sort();
  return [...known, ...extra];
}

function orderedCategories(byCategory = {}) {
  return Object.entries(byCategory).sort(
    (a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)
  );
}

function sectionLines(summary) {
  const counts = summary.counts || {};
  const bySource = counts.bySource || {};
  const byCategory = counts.byCategory || {};
  const duplicates = summary.duplicates || { groups: 0, icons: 0 };

  const lines = [
    DATA_SECTION_HEADING,
    '',
    `- **Total** : ${formatCount(summary.total ?? 0)} icônes`,
  ];

  for (const source of orderedSources(bySource)) {
    lines.push(`- **${source}** : ${formatCount(bySource[source])}`);
  }

  lines.push(
    `- **Doublons inter-sources** : ${formatCount(duplicates.groups)} groupes / ${formatCount(
      duplicates.icons
    )} icônes marquées`,
    '',
    '### Catégories principales'
  );

  for (const [category, count] of orderedCategories(byCategory)) {
    lines.push(`- \`${category}\` : ${formatCount(count)}`);
  }

  lines.push(
    '',
    '> Ces compteurs proviennent du dernier build committé (`site/public/summary.json`,',
    '> source de vérité). Le workflow hebdomadaire les régénère à chaque run.'
  );

  return lines;
}

/** Rend la section complète (titre inclus), terminée par un unique `\n`. */
export function renderDataSection(summary) {
  return `${sectionLines(summary).join('\n')}\n`;
}

/** Extrait la section existante du README, ou `null` si elle est absente. */
export function extractDataSection(readme) {
  const lines = readme.split('\n');
  const start = lines.indexOf(DATA_SECTION_HEADING);
  if (start === -1) return null;

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  }

  return lines.slice(start, end).join('\n');
}

/** `true` si la section du README correspond exactement à `summary`. */
export function isDataSectionInSync(readme, summary) {
  const current = extractDataSection(readme);
  if (current === null) return false;
  return current.trimEnd() === renderDataSection(summary).trimEnd();
}

function trimTrailingEmptyLines(lines) {
  let end = lines.length;
  while (end > 0 && lines[end - 1].trim() === '') end--;
  return lines.slice(0, end);
}

/** Remplace (ou insère) la section dans le README. Idempotent. */
export function replaceDataSection(readme, summary) {
  const lines = readme.split('\n');
  const rendered = sectionLines(summary);
  const start = lines.indexOf(DATA_SECTION_HEADING);

  if (start === -1) {
    const licence = lines.findIndex((line) => line.startsWith('## Licence'));
    const insertAt = licence === -1 ? lines.length : licence;
    const head = trimTrailingEmptyLines(lines.slice(0, insertAt));
    const tail = lines.slice(insertAt);
    return [...head, '', ...rendered, '', ...tail].join('\n');
  }

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  }

  const head = trimTrailingEmptyLines(lines.slice(0, start));
  const tail = lines.slice(end);
  return [...head, '', ...rendered, '', ...tail].join('\n');
}
