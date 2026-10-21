import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareSummaryCounts } from './summary-sync.js';

/** Résumé minimal, calqué sur la forme produite par `build-api.js`. */
function summary(overrides = {}) {
  return {
    schemaVersion: 2,
    catalogVersion: '2026.10.21-1',
    updatedAt: '2026-10-21T08:00:00.000Z',
    total: 3,
    counts: {
      bySource: { yotopixels: 1, yotoicons: 2, 'yoto-official': 0 },
      byCategory: { nature: 2, objets: 1 },
      byArtist: { sylvain: 1, '@alice': 2 },
      bySubcategory: { etoile: 2, autre: 1 },
      topTags: { star: 2 },
      topArtists: { '@alice': 2 },
    },
    duplicates: { groups: 0, icons: 0 },
    ...overrides,
  };
}

test('compareSummaryCounts : versions/dates différentes mais comptes identiques → synchrone', () => {
  const previous = summary();
  const current = summary({
    catalogVersion: '2026.10.21-2',
    updatedAt: '2026-10-21T09:30:00.000Z',
  });

  const result = compareSummaryCounts(previous, current);

  assert.equal(result.inSync, true);
  assert.deepEqual(result.differences, []);
});

test('compareSummaryCounts : un total différent est signalé', () => {
  const result = compareSummaryCounts(summary(), summary({ total: 4 }));

  assert.equal(result.inSync, false);
  assert.equal(
    result.differences.some((d) => d.includes('total')),
    true
  );
});

test('compareSummaryCounts : une valeur de counts différente est signalée', () => {
  const current = summary({
    counts: {
      bySource: { yotopixels: 2, yotoicons: 1, 'yoto-official': 0 },
      byCategory: { nature: 2, objets: 1 },
      byArtist: { sylvain: 1, '@alice': 2 },
      bySubcategory: { etoile: 2, autre: 1 },
      topTags: { star: 2 },
      topArtists: { '@alice': 2 },
    },
  });

  const result = compareSummaryCounts(summary(), current);

  assert.equal(result.inSync, false);
  assert.equal(
    result.differences.some((d) => d.includes('bySource')),
    true
  );
});

test('compareSummaryCounts : une clé de catégorie en plus est signalée', () => {
  const current = summary();
  current.counts.byCategory = { nature: 2, objets: 1, fetes: 5 };

  const result = compareSummaryCounts(summary(), current);

  assert.equal(result.inSync, false);
  assert.equal(
    result.differences.some((d) => d.includes('byCategory')),
    true
  );
});

test('compareSummaryCounts : un bloc duplicates différent est signalé', () => {
  const result = compareSummaryCounts(summary(), summary({ duplicates: { groups: 1, icons: 1 } }));

  assert.equal(result.inSync, false);
  assert.equal(
    result.differences.some((d) => d.includes('duplicates')),
    true
  );
});

test('compareSummaryCounts : résumé absent ou invalide → non synchrone', () => {
  assert.equal(compareSummaryCounts(null, summary()).inSync, false);
  assert.equal(compareSummaryCounts(summary(), undefined).inSync, false);
  assert.equal(compareSummaryCounts([], summary()).inSync, false);
});

test('compareSummaryCounts : l’ordre des clés n’est pas significatif', () => {
  const current = summary();
  current.counts.byCategory = { objets: 1, nature: 2 };

  assert.equal(compareSummaryCounts(summary(), current).inSync, true);
});
