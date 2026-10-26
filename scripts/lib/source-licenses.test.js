import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCE_LICENSES,
  DEFAULT_LICENSE,
  licenseForSource,
  applySourceLicense,
} from './source-licenses.js';

test('licenseForSource renvoie la provenance/conditions de chaque source', () => {
  assert.equal(licenseForSource('yotopixels'), 'Unspecified');
  assert.equal(licenseForSource('yotoicons'), 'Source terms');
  assert.equal(licenseForSource('yoto-official'), 'Proprietary');
});

test('SOURCE_LICENSES n’affirme aucune licence CC non déclarée par la source', () => {
  // Vérification 2026-10-26 : aucune des trois sources ne place ses icônes sous
  // une licence Creative Commons redistribuable.
  for (const value of Object.values(SOURCE_LICENSES)) {
    assert.equal(value.startsWith('CC-'), false, `licence CC non étayée : ${value}`);
  }
});

test('licenseForSource est prudent sur une source inconnue', () => {
  assert.equal(licenseForSource('inconnue'), DEFAULT_LICENSE);
  assert.equal(licenseForSource(undefined), DEFAULT_LICENSE);
});

test('SOURCE_LICENSES ne contient pas d’identifiant de licence invalide', () => {
  // `CC-BY-SC` n'existe ni chez Creative Commons ni en SPDX : il ne doit plus
  // apparaître dans la table des licences.
  assert.equal(Object.values(SOURCE_LICENSES).includes('CC-BY-SC'), false);
});

test('applySourceLicense impose la licence canonique de la source', () => {
  const normalized = applySourceLicense({ id: 'yt-1', source: 'yotopixels', license: 'CC-BY-SC' });
  assert.equal(normalized.license, 'Unspecified');
  // Le reste des champs est préservé.
  assert.equal(normalized.id, 'yt-1');
});

test('applySourceLicense ne mute pas l’entrée', () => {
  const input = { id: 'x', source: 'yotoicons', license: 'faux' };
  const output = applySourceLicense(input);
  assert.equal(input.license, 'faux');
  assert.notEqual(output, input);
});
