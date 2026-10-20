import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inferTags, tokenize } from './inferTags.js';

test('tokenize normalise en minuscules et coupe la ponctuation', () => {
  assert.deepEqual(tokenize('Crescent Moon!'), ['crescent', 'moon']);
  assert.deepEqual(tokenize('  ---  '), []);
  assert.deepEqual(tokenize('cœur noir'), ['cœur', 'noir']);
});

test('infère un tag depuis un titre descriptif', () => {
  assert.deepEqual(inferTags('crescent moon'), ['moon']);
  assert.ok(inferTags('snowy day').includes('weather'));
  assert.ok(inferTags('red heart').includes('heart'));
});

test('conserve les tags existants et ajoute ceux déduits', () => {
  const tags = inferTags('ballet moon', ['custom']);
  assert.ok(tags.includes('custom'));
  assert.ok(tags.includes('moon'));
});

test("retourne ['icon'] quand rien ne correspond", () => {
  assert.deepEqual(inferTags('Ninimo'), ['icon']);
  assert.deepEqual(inferTags(''), ['icon']);
  assert.deepEqual(inferTags('Strega Nona'), ['icon']);
});

// --- Régression : la correspondance par sous-chaîne produisait des faux positifs ---

test("« Train » ne doit PLUS recevoir le tag weather (rain est dans train)", () => {
  const tags = inferTags('Train');
  assert.ok(tags.includes('transport'), 'Train doit rester transport');
  assert.ok(!tags.includes('weather'), 'Train ne doit pas être weather');
});

test("« Scarface » ne doit recevoir ni transport (car) ni people (face)", () => {
  const tags = inferTags('Scarface');
  assert.ok(!tags.includes('transport'));
  assert.ok(!tags.includes('people'));
});

test("« Playing Card » ne doit recevoir ni transport (card) ni media (play)", () => {
  const tags = inferTags('Playing Card');
  assert.ok(!tags.includes('transport'));
  // « playing » != mot entier « play »
  assert.ok(!tags.includes('media'));
});

test('« Thunderstorm » reçoit weather via le mot-clé complet thunderstorm', () => {
  assert.deepEqual(inferTags('Thunderstorm'), ['weather']);
});

test('les mots-clés multi-mots fonctionnent en phrase consécutive', () => {
  // « New York » n'est pas dans la map, mais testons la mécanique phrase :
  assert.ok(inferTags('sunny day').includes('sun'));
});
