import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCatalogVersion, nextCatalogVersion } from './catalog-version.js';

const AT = new Date('2026-10-21T09:00:00.000Z');

test('formatCatalogVersion produit YYYY.MM.DD-1', () => {
  assert.equal(formatCatalogVersion(AT, 1), '2026.10.21-1');
  assert.equal(formatCatalogVersion(AT, 3), '2026.10.21-3');
});

test('nextCatalogVersion démarre à -1 sans version précédente', () => {
  assert.equal(nextCatalogVersion(undefined, AT), '2026.10.21-1');
  assert.equal(nextCatalogVersion(null, AT), '2026.10.21-1');
});

test('nextCatalogVersion incrémente le compteur du même jour', () => {
  assert.equal(nextCatalogVersion('2026.10.21-1', AT), '2026.10.21-2');
  assert.equal(nextCatalogVersion('2026.10.21-9', AT), '2026.10.21-10');
});

test('nextCatalogVersion repart à -1 un autre jour', () => {
  assert.equal(nextCatalogVersion('2026.10.20-5', AT), '2026.10.21-1');
});

test('nextCatalogVersion tolère une version précédente malformée', () => {
  assert.equal(nextCatalogVersion('n’importe quoi', AT), '2026.10.21-1');
  assert.equal(nextCatalogVersion('2026.10.21-', AT), '2026.10.21-1');
  assert.equal(nextCatalogVersion('2026.10.21-abc', AT), '2026.10.21-1');
  assert.equal(nextCatalogVersion('2026.10.21-0', AT), '2026.10.21-1');
});

test('le résultat est strictement croissant le même jour', () => {
  const first = nextCatalogVersion(undefined, AT);
  const second = nextCatalogVersion(first, AT);
  const third = nextCatalogVersion(second, AT);
  assert.deepEqual([first, second, third], ['2026.10.21-1', '2026.10.21-2', '2026.10.21-3']);
});
