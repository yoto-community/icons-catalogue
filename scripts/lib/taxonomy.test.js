import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CATEGORIES,
  SUBCATEGORIES,
  DEFAULT_CATEGORY,
  DEFAULT_SUBCATEGORY,
  inferCategory,
  inferSubcategory,
} from './taxonomy.js';

test('les valeurs par défaut sont des membres de chaque enum', () => {
  assert.ok(CATEGORIES.includes(DEFAULT_CATEGORY));
  assert.ok(SUBCATEGORIES.includes(DEFAULT_SUBCATEGORY));
});

test('CATEGORIES reste synchronisé avec CATEGORY_LABELS (UI)', () => {
  const source = readFileSync(
    new URL('../../site/src/constants/categories.ts', import.meta.url),
    'utf8'
  );
  const block = source.split('CATEGORY_LABELS')[1].split('};')[0];
  const uiCategories = [...block.matchAll(/^\s*([a-z]+):\s*'/gm)].map((m) => m[1]);

  assert.deepEqual(
    [...uiCategories].sort(),
    [...CATEGORIES].sort(),
    'une catégorie du scraper n’a pas de libellé dans l’UI (ou inversement)'
  );
});

test('inferCategory reconnaît les grandes familles', () => {
  assert.equal(inferCategory('Crescent Moon'), 'nature');
  assert.equal(inferCategory('Red Car'), 'transport');
  assert.equal(inferCategory('Cheese Pizza'), 'nourriture');
  assert.equal(inferCategory('Electric Guitar'), 'musique');
  assert.equal(inferCategory('Funny Robot'), 'personnages');
  assert.equal(inferCategory('Blue Circle'), 'formes');
  assert.equal(inferCategory('Happy Halloween'), 'emotions');
  assert.equal(inferCategory('Halloween Pumpkin'), 'fetes');
  assert.equal(inferCategory('Cute Cat'), 'animaux');
  assert.equal(inferCategory('Old House'), 'batiments');
  assert.equal(inferCategory('Running'), 'activites');
  assert.equal(inferCategory('Happy Face'), 'emotions');
});

test('inferCategory : « cake » reste nourriture même pour Noël (ordre des règles)', () => {
  assert.equal(inferCategory('Christmas Cake'), 'nourriture');
  // « arbre de Noël » : `nature` est testé avant `fetes` (comme historiquement).
  assert.equal(inferCategory('Christmas Tree'), 'nature');
});

test('inferCategory retombe sur la catégorie par défaut', () => {
  assert.equal(inferCategory('Ninimo'), DEFAULT_CATEGORY);
  assert.equal(inferCategory(''), DEFAULT_CATEGORY);
});

test('inferCategory s’appuie aussi sur les tags fournis', () => {
  assert.equal(inferCategory('Icon', ['moon']), 'nature');
  assert.equal(inferCategory('Icon', ['animal']), 'animaux');
  assert.equal(inferCategory('Icon', ['transport']), 'transport');
});

test('inferCategory : pas de faux positif par sous-chaîne', () => {
  // « Scarface » ne contient pas le MOT « car » ; « Train » ne contient pas « rain ».
  assert.equal(inferCategory('Scarface'), DEFAULT_CATEGORY);
  assert.equal(inferCategory('Train'), 'transport');
});

test('inferCategory gère les accents', () => {
  assert.equal(inferCategory('étoile'), 'nature');
  assert.equal(inferCategory('Cœur brisé'), 'emotions');
});

test('inferSubcategory reconnaît les sous-catégories spécifiques', () => {
  assert.equal(inferSubcategory('Crescent Moon'), 'lune');
  assert.equal(inferSubcategory('Sunny day'), 'soleil');
  assert.equal(inferSubcategory('Yellow Star'), 'etoile');
  assert.equal(inferSubcategory('Red Heart'), 'coeur');
  assert.equal(inferSubcategory('Green Leaf'), 'plante');
  assert.equal(inferSubcategory('Cute Cat'), 'chat');
  assert.equal(inferSubcategory('Happy Dog'), 'chien');
  assert.equal(inferSubcategory('Little Bird'), 'oiseau');
  assert.equal(inferSubcategory('Right Arrow'), 'fleche');
  assert.equal(inferSubcategory('Fast Car'), 'vehicule');
  assert.equal(inferSubcategory('Big House'), 'batiment');
  assert.equal(inferSubcategory('Cheese Pizza'), 'nourriture');
  assert.equal(inferSubcategory('Music Note'), 'musique');
  assert.equal(inferSubcategory('Christmas Santa'), 'noel');
  assert.equal(inferSubcategory('Halloween Pumpkin'), 'halloween');
  assert.equal(inferSubcategory('Birthday Balloon'), 'anniversaire');
});

test('inferSubcategory retombe sur « autre »', () => {
  assert.equal(inferSubcategory('Ninimo'), DEFAULT_SUBCATEGORY);
  assert.equal(inferSubcategory('', []), DEFAULT_SUBCATEGORY);
});

test('toutes les valeurs produites appartiennent aux enums canoniques', () => {
  const titles = [
    'Crescent Moon', 'Red Car', 'Cheese Pizza', 'Electric Guitar', 'Funny Robot',
    'Blue Circle', 'Christmas Tree', 'Cute Cat', 'Old House', 'Running', 'Smiling Face',
    'Scarface', 'Train', 'étoile', 'Cœur brisé', 'Ninimo', '',
  ];

  for (const title of titles) {
    assert.ok(CATEGORIES.includes(inferCategory(title)), `catégorie hors enum pour « ${title} »`);
    assert.ok(
      SUBCATEGORIES.includes(inferSubcategory(title)),
      `sous-catégorie hors enum pour « ${title} »`
    );
  }
});
