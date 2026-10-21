import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertSourcesPresent,
  assertNoRegression,
  DEFAULT_SOURCES,
  MAX_SHRINK_RATIO,
} from './catalogue-guards.js';

test('DEFAULT_SOURCES liste les trois sources attendues', () => {
  assert.deepEqual(DEFAULT_SOURCES, ['yotopixels', 'yotoicons', 'yoto-official']);
});

test('assertSourcesPresent accepte un catalogue complet', () => {
  assert.doesNotThrow(() =>
    assertSourcesPresent({ yotopixels: 1314, yotoicons: 25627, 'yoto-official': 519 })
  );
});

test('assertSourcesPresent refuse une source absente', () => {
  assert.throws(
    () => assertSourcesPresent({ yotopixels: 1314, yotoicons: 25627 }),
    /yoto-official/
  );
});

test('assertSourcesPresent refuse une source vide', () => {
  assert.throws(
    () => assertSourcesPresent({ yotopixels: 1314, yotoicons: 0, 'yoto-official': 519 }),
    /yotoicons/
  );
});

test('assertNoRegression ne fait rien sans référence précédente', () => {
  assert.doesNotThrow(() => assertNoRegression(100, 0));
  assert.doesNotThrow(() => assertNoRegression(100, undefined));
});

test('assertNoRegression tolère une petite variation', () => {
  // 2 % de baisse < tolérance de 5 %.
  assert.doesNotThrow(() => assertNoRegression(9800, 10000));
});

test('assertNoRegression refuse une chute au-delà de la tolérance', () => {
  assert.throws(() => assertNoRegression(5000, 10000), /chuté/i);
});

test('assertNoRegression respecte une tolérance personnalisée', () => {
  assert.throws(() => assertNoRegression(9800, 10000, { maxShrink: 0.01 }), /chuté/i);
});

test('la tolérance par défaut est de 5 %', () => {
  assert.equal(MAX_SHRINK_RATIO, 0.05);
});
