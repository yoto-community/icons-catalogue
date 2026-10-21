import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeTitle,
  findCrossSourceDuplicates,
  markDuplicates,
  SOURCE_PRIORITY,
} from './dedupe.js';

function icon(id, source, title, category = 'objets', downloads = 0) {
  return { id, source, title, category, downloads, metadata: undefined };
}

test('normalizeTitle : casse, accents et ponctuation neutralisés', () => {
  assert.equal(normalizeTitle('Winnie-the-Pooh'), 'winnie the pooh');
  assert.equal(normalizeTitle('Étoile'), 'etoile');
  assert.equal(normalizeTitle('Snow  Flake!!'), 'snow flake');
  assert.equal(normalizeTitle('  T-Rex  '), 't rex');
});

test('normalizeTitle : entrée vide/invalide → chaîne vide', () => {
  assert.equal(normalizeTitle(''), '');
  assert.equal(normalizeTitle(undefined), '');
  assert.equal(normalizeTitle(null), '');
});

test('findCrossSourceDuplicates : ne retient que le recouvrement inter-sources', () => {
  const icons = [
    icon('yp1', 'yotopixels', 'Ladybird'),
    icon('yo1', 'yoto-official', 'ladybird'),
    icon('yi1', 'yotoicons', 'Ladybird'),
    // Même source uniquement → ignoré.
    icon('yi2', 'yotoicons', 'dog', 'animaux'),
    icon('yi3', 'yotoicons', 'dog', 'animaux'),
    // Titre vide → ignoré.
    icon('yi4', 'yotoicons', '', 'animaux'),
  ];

  const groups = findCrossSourceDuplicates(icons);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].members.map((m) => m.id).sort(), ['yi1', 'yo1', 'yp1']);
});

test('findCrossSourceDuplicates : ignore les groupes ambigus (> maxPerSource)', () => {
  const icons = [
    icon('yp2', 'yotopixels', 'Rabbit', 'animaux'),
    icon('yi5', 'yotoicons', 'rabbit', 'animaux'),
    icon('yi6', 'yotoicons', 'rabbit', 'animaux'),
  ];

  assert.equal(findCrossSourceDuplicates(icons).length, 0);
  assert.equal(findCrossSourceDuplicates(icons, { maxPerSource: 2 }).length, 1);
});

test('findCrossSourceDuplicates : la catégorie fait partie de la clé', () => {
  const icons = [
    icon('yp3', 'yotopixels', 'Fire', 'nature'),
    icon('yo3', 'yoto-official', 'Fire', 'objets'),
  ];

  assert.equal(findCrossSourceDuplicates(icons).length, 0);
});

test('markDuplicates : canonique = source prioritaire, sans mutation de l’entrée', () => {
  const icons = [
    icon('yi1', 'yotoicons', 'ladybird'),
    icon('yp1', 'yotopixels', 'Ladybird'),
    icon('yo1', 'yoto-official', 'ladybird'),
  ];

  const { groups, duplicateOf } = markDuplicates(icons);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].canonicalId, 'yo1');
  assert.deepEqual([...duplicateOf.entries()].sort(), [
    ['yi1', 'yo1'],
    ['yp1', 'yo1'],
  ]);
  // Aucune mutation des objets d'origine.
  assert.equal(icons.every((i) => i.metadata === undefined), true);
  assert.equal(SOURCE_PRIORITY[0], 'yoto-official');
});

test('markDuplicates : à priorité de source égale, le plus téléchargé gagne', () => {
  // maxPerSource: 2 autorise deux entrées de la même source.
  const icons = [
    icon('yp1', 'yotopixels', 'Star', 'nature', 5),
    icon('yp2', 'yotopixels', 'star', 'nature', 42),
    icon('yo1', 'yoto-official', 'star', 'nature', 0),
  ];

  const { duplicateOf } = markDuplicates(icons, { maxPerSource: 2 });
  assert.equal(duplicateOf.get('yp1'), 'yo1');
  assert.equal(duplicateOf.get('yp2'), 'yo1');
});
