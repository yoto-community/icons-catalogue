import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseIconOnClick,
  parseIconsFromHtml,
  buildTitle,
  buildTags,
  buildImageUrl,
  mapCategory,
  mapSubcategory,
  toNormalizedIcon,
  SOURCE_CATEGORY_MAP,
  SOURCE_SUBCATEGORY_MAP,
} from './yotoicons.js';
import { contentId } from './content-id.js';

/** Identifiant de contenu déterministe à partir d'une graine lisible. */
const cid = (seed) => contentId(Buffer.from(String(seed)));

test('parseIconOnClick extrait les six arguments', () => {
  const parsed = parseIconOnClick(
    "populate_icon_modal('2706', 'animals', 'Bluey', 'Creek', 'allisonhopes', '13652');"
  );
  assert.deepEqual(parsed, {
    id: '2706',
    category: 'animals',
    tag1: 'Bluey',
    tag2: 'Creek',
    author: 'allisonhopes',
    downloads: 13652,
  });
});

test('parseIconOnClick gère un tag secondaire vide', () => {
  const parsed = parseIconOnClick(
    "populate_icon_modal('342', 'people', 'moana', '', 'AV', '9630')"
  );
  assert.equal(parsed.tag2, '');
  assert.equal(parsed.downloads, 9630);
});

test('parseIconOnClick gère les tags contenant des virgules', () => {
  const parsed = parseIconOnClick(
    "populate_icon_modal('1760', 'places', 'Creek, Bluey', 'River', 'm_hansard', '9530')"
  );
  assert.equal(parsed.tag1, 'Creek, Bluey');
  assert.equal(parsed.category, 'places');
});

test('parseIconOnClick retourne null sur une entrée invalide', () => {
  assert.equal(parseIconOnClick(''), null);
  assert.equal(parseIconOnClick(undefined), null);
  assert.equal(parseIconOnClick('autre_chose()'), null);
  // id non numérique
  assert.equal(parseIconOnClick("populate_icon_modal('abc', 'animals', '', '', 'a', '1')"), null);
});

test('parseIconsFromHtml extrait toutes les icônes d’une page', () => {
  const html = `
    <div class="icon" onclick="populate_icon_modal('1', 'animals', 'fox', '', 'a', '10');">
      <img src="/static/uploads/1.png">
    </div>
    <div class="icon" onclick="populate_icon_modal('2', 'food', 'cake', 'birthday', 'b', '5');">
      <img src="/static/uploads/2.png">
    </div>`;
  const icons = parseIconsFromHtml(html);
  assert.equal(icons.length, 2);
  assert.deepEqual(
    icons.map((i) => i.id),
    ['1', '2']
  );
});

test('parseIconsFromHtml tolère un HTML sans icônes', () => {
  assert.deepEqual(parseIconsFromHtml('<html></html>'), []);
  assert.deepEqual(parseIconsFromHtml(undefined), []);
});

test('buildTitle privilégie tag1 puis tag2 puis le repli', () => {
  assert.equal(buildTitle('Bluey', 'Creek', '2706'), 'Bluey');
  assert.equal(buildTitle('', 'Creek', '2706'), 'Creek');
  assert.equal(buildTitle('', '', '2706'), 'icon-2706');
});

test('buildTags déduplique, minuscule et ajoute la catégorie source', () => {
  assert.deepEqual(buildTags('Bluey', 'bluey', 'animals', 'Bluey'), ['bluey', 'animals']);
  // Aucun tag → inférence depuis le titre
  assert.deepEqual(buildTags('', '', 'animals', 'crescent moon'), ['moon']);
});

test('mapCategory traduit le vocabulaire source', () => {
  assert.equal(mapCategory('animals', 'x', []), 'animaux');
  assert.equal(mapCategory('people', 'x', []), 'personnages');
  assert.equal(mapCategory('vehicles', 'x', []), 'transport');
  assert.equal(mapCategory('food', 'x', []), 'nourriture');
  assert.equal(mapCategory('PATTERNS', 'x', []), 'formes');
  // Catégorie inconnue → classifieur par mots-clés
  assert.equal(mapCategory('inconnue', 'crescent moon', ['moon']), 'nature');
});

test('chaque valeur de SOURCE_CATEGORY_MAP est une catégorie canonique', () => {
  const canonical = new Set([
    'objets',
    'nature',
    'animaux',
    'musique',
    'personnages',
    'fetes',
    'transport',
    'activites',
    'emotions',
    'nourriture',
    'batiments',
    'formes',
  ]);
  for (const [source, target] of Object.entries(SOURCE_CATEGORY_MAP)) {
    assert.ok(canonical.has(target), `${source} → ${target} n'est pas canonique`);
  }
});

test('mapSubcategory : inférence par mots-clés prioritaire', () => {
  // « cake » est reconnu → sous-catégorie inférée, pas de repli générique
  assert.equal(mapSubcategory('food', 'Cake', ['cake']), 'nourriture');
  // « moon » l'emporte sur le repli `plante` de la catégorie source
  assert.equal(mapSubcategory('plants', 'Crescent moon', ['moon']), 'lune');
});

test('mapSubcategory : repli sur la catégorie source quand l’inférence reste générique', () => {
  // Titre/tags non descriptifs → repli sur SOURCE_SUBCATEGORY_MAP
  assert.equal(mapSubcategory('animals', 'Bluey', ['bluey']), 'animal');
  assert.equal(mapSubcategory('vehicles', 'Blob', ['blob']), 'vehicule');
  // Catégorie source inconnue → repli générique
  assert.equal(mapSubcategory('inconnue', 'Blob', ['blob']), 'autre');
});

test('chaque valeur de SOURCE_SUBCATEGORY_MAP est une sous-catégorie canonique', () => {
  const canonical = new Set([
    'lune',
    'soleil',
    'etoile',
    'coeur',
    'plante',
    'chat',
    'chien',
    'oiseau',
    'fleche',
    'animal',
    'vehicule',
    'batiment',
    'nourriture',
    'musique',
    'noel',
    'halloween',
    'anniversaire',
    'autre',
  ]);
  for (const [source, target] of Object.entries(SOURCE_SUBCATEGORY_MAP)) {
    assert.ok(canonical.has(target), `${source} → ${target} n'est pas canonique`);
  }
});

test('buildImageUrl construit l’URL canonique de l’image', () => {
  assert.equal(buildImageUrl('2706'), 'https://www.yotoicons.com/static/uploads/2706.png');
  assert.equal(buildImageUrl(42), 'https://www.yotoicons.com/static/uploads/42.png');
});

test('toNormalizedIcon produit une icône au schéma commun', () => {
  const parsed = parseIconOnClick(
    "populate_icon_modal('2706', 'animals', 'Bluey', 'Creek', 'allisonhopes', '13652')"
  );
  const icon = toNormalizedIcon(parsed, {
    contentId: cid('yotoicons-2706'),
    scrapedAt: '2026-10-21T00:00:00.000Z',
  });
  assert.equal(icon.id, cid('yotoicons-2706'));
  assert.equal(icon.source, 'yotoicons');
  assert.equal(icon.title, 'Bluey');
  assert.equal(icon.category, 'animaux');
  assert.equal(icon.subcategory, 'animal');
  assert.equal(icon.downloads, 13652);
  assert.equal(icon.license, 'Source terms');
  assert.equal(icon.download_url, 'https://www.yotoicons.com/static/uploads/2706.png');
  assert.equal(icon.preview_image, icon.download_url);
  assert.equal(icon.metadata.source_id, '2706');
  assert.equal(icon.metadata.numeric_id, '2706');
  assert.equal(icon.metadata.source_category, 'animals');
  assert.equal(icon.metadata.content_encoding, 'base64url');
  assert.equal(icon.date_added, '2026-10-21T00:00:00.000Z');
});

test('toNormalizedIcon exige un identifiant de contenu (pas d’id provisoire)', () => {
  const parsed = parseIconOnClick(
    "populate_icon_modal('2706', 'animals', 'Bluey', 'Creek', 'allisonhopes', '13652')"
  );
  assert.throws(() => toNormalizedIcon(parsed), /contentId/);
  assert.throws(() => toNormalizedIcon(parsed, { contentId: 'yi-allisonhopes-2706' }), /contentId/);
});
