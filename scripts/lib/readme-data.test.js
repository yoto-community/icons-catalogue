import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DATA_SECTION_HEADING,
  formatCount,
  renderDataSection,
  extractDataSection,
  isDataSectionInSync,
  replaceDataSection,
} from './readme-data.js';

const SUMMARY = {
  schemaVersion: 2,
  catalogVersion: '2026.10.21-6',
  updatedAt: '2026-10-21T10:08:33.460Z',
  total: 27460,
  counts: {
    bySource: { yotoicons: 25627, yotopixels: 1314, 'yoto-official': 519 },
    byCategory: { objets: 8196, animaux: 6375, musique: 21 },
  },
  duplicates: { groups: 45, icons: 45 },
};

const EXPECTED_SECTION = `## Données actuelles (dernier build)

- **Total** : 27 460 icônes
- **yotopixels** : 1 314
- **yotoicons** : 25 627
- **yoto-official** : 519
- **Doublons inter-sources** : 45 groupes / 45 icônes marquées

### Catégories principales
- \`objets\` : 8 196
- \`animaux\` : 6 375
- \`musique\` : 21

> Ces compteurs proviennent du dernier build committé (\`site/public/summary.json\`,
> source de vérité). Le workflow hebdomadaire les régénère à chaque run.
`;

test('formatCount sépare les milliers par un espace', () => {
  assert.equal(formatCount(0), '0');
  assert.equal(formatCount(999), '999');
  assert.equal(formatCount(1000), '1 000');
  assert.equal(formatCount(27460), '27 460');
  assert.equal(formatCount(1234567), '1 234 567');
});

test('renderDataSection produit la section complète', () => {
  assert.equal(renderDataSection(SUMMARY), EXPECTED_SECTION);
});

test('renderDataSection ordonne les sources canoniquement', () => {
  const section = renderDataSection({
    total: 3,
    counts: { bySource: { 'yoto-official': 1, yotoicons: 1, yotopixels: 1 }, byCategory: {} },
    duplicates: { groups: 0, icons: 0 },
  });
  const order = ['yotopixels', 'yotoicons', 'yoto-official'];
  const positions = order.map((source) => section.indexOf(`**${source}**`));
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
    'les sources doivent apparaître dans l’ordre canonique'
  );
});

test('renderDataSection trie les catégories par effectif décroissant', () => {
  const section = renderDataSection(SUMMARY);
  const objets = section.indexOf('`objets`');
  const animaux = section.indexOf('`animaux`');
  const musique = section.indexOf('`musique`');
  assert.ok(objets < animaux && animaux < musique);
});

test('extractDataSection renvoie la section existante', () => {
  const readme = `# Titre\n\n## Avant\n\nblabla\n\n${EXPECTED_SECTION}\n## Licence\n\nMIT.\n`;
  assert.equal(extractDataSection(readme).trimEnd(), EXPECTED_SECTION.trimEnd());
});

test('extractDataSection renvoie null si la section est absente', () => {
  assert.equal(extractDataSection('# Titre\n\n## Licence\n'), null);
});

test('isDataSectionInSync compare README et summary', () => {
  const inSyncReadme = `# T\n\n${EXPECTED_SECTION}\n## Licence\n`;
  assert.equal(isDataSectionInSync(inSyncReadme, SUMMARY), true);

  const drifted = inSyncReadme.replace('27 460', '27 399');
  assert.equal(isDataSectionInSync(drifted, SUMMARY), false);

  assert.equal(isDataSectionInSync('# T\n\n## Licence\n', SUMMARY), false);
});

test('replaceDataSection remplace la section et préserve le reste', () => {
  const readme = `# Titre\n\n## Avant\n\nblabla\n\n## Données actuelles (dernier build)\n\n- **Total** : 27 399 icônes\n\n## Licence\n\nMIT.\n`;
  const updated = replaceDataSection(readme, SUMMARY);

  assert.ok(updated.startsWith('# Titre\n\n## Avant\n\nblabla\n\n'));
  assert.ok(updated.endsWith('## Licence\n\nMIT.\n'));
  assert.equal(extractDataSection(updated).trimEnd(), EXPECTED_SECTION.trimEnd());
  assert.equal(isDataSectionInSync(updated, SUMMARY), true);
});

test('replaceDataSection est idempotent', () => {
  const readme = `# Titre\n\n${EXPECTED_SECTION}\n## Licence\n\nMIT.\n`;
  const once = replaceDataSection(readme, SUMMARY);
  const twice = replaceDataSection(once, SUMMARY);
  assert.equal(once, twice);
});

test('replaceDataSection insère la section quand elle manque', () => {
  const readme = `# Titre\n\n## Licence\n\nMIT.\n`;
  const updated = replaceDataSection(readme, SUMMARY);

  assert.ok(updated.includes(DATA_SECTION_HEADING));
  assert.equal(isDataSectionInSync(updated, SUMMARY), true);
  assert.ok(updated.endsWith('## Licence\n\nMIT.\n'));
});
