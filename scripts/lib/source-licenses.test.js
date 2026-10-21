import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCE_LICENSES,
  DEFAULT_LICENSE,
  licenseForSource,
  applySourceLicense,
} from './source-licenses.js';

test('licenseForSource renvoie la licence de chaque source', () => {
  assert.equal(licenseForSource('yotopixels'), 'CC-BY-SA');
  assert.equal(licenseForSource('yotoicons'), 'CC-BY-NC');
  assert.equal(licenseForSource('yoto-official'), 'Yoto Official');
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
  assert.equal(normalized.license, 'CC-BY-SA');
  // Le reste des champs est préservé.
  assert.equal(normalized.id, 'yt-1');
});

test('applySourceLicense ne mute pas l’entrée', () => {
  const input = { id: 'x', source: 'yotoicons', license: 'faux' };
  const output = applySourceLicense(input);
  assert.equal(input.license, 'faux');
  assert.notEqual(output, input);
});
