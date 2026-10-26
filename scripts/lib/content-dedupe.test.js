import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickCanonical, mergeContentDuplicates } from './content-dedupe.js';

/**
 * Icône adressée par contenu : `id` = identifiant de contenu (partagé par les
 * doublons exacts), `metadata.source_id` = identifiant natif de la source.
 */
function icon(id, source, { sourceId = id, downloads = 0 } = {}) {
  return { id, source, downloads, metadata: { source_id: sourceId } };
}

test('mergeContentDuplicates : contenus uniques → aucun changement, aucune fusion', () => {
  const icons = [
    icon('aaa', 'yotopixels'),
    icon('bbb', 'yotoicons'),
    icon('ccc', 'yoto-official'),
  ];

  const result = mergeContentDuplicates(icons);
  assert.equal(result.icons.length, 3);
  assert.equal(result.merged, 0);
  assert.deepEqual(result.groups, []);
});

test('mergeContentDuplicates : doublon intra-source → canonique par downloads', () => {
  const icons = [
    icon('same', 'yotoicons', { sourceId: '1', downloads: 3 }),
    icon('same', 'yotoicons', { sourceId: '2', downloads: 42 }),
  ];

  const result = mergeContentDuplicates(icons);
  assert.equal(result.icons.length, 1);
  assert.equal(result.merged, 1);
  assert.equal(result.icons[0].metadata.source_id, '2');
  assert.deepEqual(result.icons[0].metadata.merged_source_ids, ['1', '2']);
  assert.equal(result.icons[0].metadata.merged_count, 2);
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].canonicalId, 'same');
  assert.deepEqual(result.groups[0].sources, ['yotoicons']);
});

test('mergeContentDuplicates : inter-sources → la source prioritaire gagne', () => {
  const icons = [
    icon('same', 'yotoicons', { sourceId: '100' }),
    icon('same', 'yoto-official', { sourceId: 'media' }),
    icon('same', 'yotopixels', { sourceId: 'uuid' }),
  ];

  const result = mergeContentDuplicates(icons);
  assert.equal(result.icons.length, 1);
  assert.equal(result.merged, 2);
  assert.equal(result.icons[0].source, 'yoto-official');
  assert.deepEqual(result.groups[0].sources.sort(), [
    'yoto-official',
    'yotoicons',
    'yotopixels',
  ]);
});

test('pickCanonical : départage par source_id croissant à égalité', () => {
  const members = [
    icon('same', 'yotoicons', { sourceId: '300', downloads: 5 }),
    icon('same', 'yotoicons', { sourceId: '200', downloads: 5 }),
  ];

  assert.equal(pickCanonical(members).metadata.source_id, '200');
});

test('mergeContentDuplicates : déterministe quel que soit l’ordre d’entrée', () => {
  const a = icon('same', 'yotoicons', { sourceId: '1', downloads: 1 });
  const b = icon('same', 'yotoicons', { sourceId: '2', downloads: 9 });

  const r1 = mergeContentDuplicates([a, b]);
  const r2 = mergeContentDuplicates([b, a]);

  assert.equal(r1.icons[0].metadata.source_id, r2.icons[0].metadata.source_id);
  assert.deepEqual(r1.icons[0].metadata.merged_source_ids, r2.icons[0].metadata.merged_source_ids);
});

test('mergeContentDuplicates : ne mute jamais les entrées d’origine', () => {
  const a = icon('same', 'yotoicons', { sourceId: '1' });
  const b = icon('same', 'yoto-official', { sourceId: '2' });

  mergeContentDuplicates([a, b]);

  assert.deepEqual(Object.keys(a.metadata), ['source_id']);
  assert.deepEqual(Object.keys(b.metadata), ['source_id']);
});

test('mergeContentDuplicates : entrée non tableau → résultat vide', () => {
  assert.deepEqual(mergeContentDuplicates(undefined), {
    icons: [],
    groups: [],
    merged: 0,
  });
});
