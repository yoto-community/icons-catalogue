import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCES,
  LICENSES,
  SCHEMA_VERSION,
  validateIcon,
  validateIcons,
  validateSummary,
  validateManifest,
  assertValidCatalogue,
} from './catalogue-schema.js';
import { contentId } from './content-id.js';

// ---------------------------------------------------------------------------
// Fixtures minimales, alignées sur la forme réellement produite par
// `build-api.js` (icons.json / summary.json / index.json).
// ---------------------------------------------------------------------------

/** Identifiant de contenu déterministe à partir d'une graine lisible. */
const cid = (seed) => contentId(Buffer.from(String(seed)));

function validIcon(overrides = {}) {
  return {
    id: cid('valid'),
    source: 'yotopixels',
    title: 'Star',
    artist: 'sylvain',
    preview_image: 'https://yotopixels.com/icons/1.png',
    download_url: 'https://yotopixels.com/icons/1.png',
    category: 'nature',
    subcategory: 'etoile',
    downloads: 3,
    date_added: '2026-10-17T16:51:35.062Z',
    license: 'CC-BY-SA',
    tags: ['star'],
    metadata: { source_id: 'native-1' },
    ...overrides,
  };
}

function validSummary(overrides = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    catalogVersion: '2026.10.21-1',
    updatedAt: '2026-10-21T08:00:00.000Z',
    total: 2,
    counts: {
      bySource: { yotopixels: 1, yotoicons: 1, 'yoto-official': 0 },
      byCategory: { nature: 1, objets: 1 },
      byArtist: { sylvain: 1, Yoto: 1 },
      bySubcategory: { etoile: 1, autre: 1 },
      topTags: { star: 1 },
      topArtists: { sylvain: 1 },
    },
    duplicates: { groups: 0, icons: 0 },
    ...overrides,
  };
}

function validManifest(overrides = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    catalogVersion: '2026.10.21-1',
    updatedAt: '2026-10-21T08:00:00.000Z',
    counts: {
      total: 2,
      bySource: { yotopixels: 1, yotoicons: 1, 'yoto-official': 0 },
      byCategory: { nature: 1, objets: 1 },
    },
    sources: [
      { id: 'yotopixels', count: 1 },
      { id: 'yotoicons', count: 1 },
      { id: 'yoto-official', count: 0 },
    ],
    categories: [
      { id: 'nature', count: 1 },
      { id: 'objets', count: 1 },
    ],
    shards: [{ path: 'icons.json', type: 'full', count: 2, bytes: 10, sha256: 'a'.repeat(64) }],
    searchIndex: { path: 'search-index.json', bytes: 10, sha256: 'b'.repeat(64) },
    summary: { path: 'summary.json', bytes: 10, sha256: 'c'.repeat(64) },
    ...overrides,
  };
}

/** Vrai si au moins une erreur mentionne `needle`. */
function mentions(errors, needle) {
  return errors.some((error) => error.includes(needle));
}

// ---------------------------------------------------------------------------
// Constantes exposées
// ---------------------------------------------------------------------------

test('les enums exposées proviennent des sources uniques', () => {
  assert.deepEqual(SOURCES, ['yotopixels', 'yotoicons', 'yoto-official']);
  assert.deepEqual(LICENSES, ['CC-BY-SA', 'CC-BY-NC', 'Yoto Official']);
  assert.equal(SCHEMA_VERSION, 3);
});

// ---------------------------------------------------------------------------
// validateIcon
// ---------------------------------------------------------------------------

test('validateIcon : une icône conforme ne produit aucune erreur', () => {
  assert.deepEqual(validateIcon(validIcon()), []);
});

test('validateIcon : l’id doit être un identifiant de contenu base64url (43 car.)', () => {
  assert.equal(mentions(validateIcon(validIcon({ id: 'yt-1' })), 'id'), true);
  assert.equal(mentions(validateIcon(validIcon({ id: 'a'.repeat(64) })), 'id'), true);
  assert.equal(mentions(validateIcon(validIcon({ id: cid('ok') })), 'id'), false);
});

test('validateIcon : refuse un non-objet', () => {
  assert.deepEqual(validateIcon(null), ['icône : objet attendu']);
  assert.deepEqual(validateIcon([]), ['icône : objet attendu']);
  assert.deepEqual(validateIcon('x'), ['icône : objet attendu']);
});

test('validateIcon : signale les champs texte requis manquants ou vides', () => {
  const errors = validateIcon(validIcon({ title: '  ', artist: undefined }));
  assert.equal(mentions(errors, 'title'), true);
  assert.equal(mentions(errors, 'artist'), true);
});

test('validateIcon : rejette une source, une catégorie ou une sous-catégorie hors enum', () => {
  assert.equal(mentions(validateIcon(validIcon({ source: 'inconnu' })), 'source'), true);
  assert.equal(mentions(validateIcon(validIcon({ category: 'zzz' })), 'category'), true);
  assert.equal(mentions(validateIcon(validIcon({ subcategory: 'étoile' })), 'subcategory'), true);
});

test('validateIcon : la licence doit exister ET correspondre à la source', () => {
  const inconnue = validateIcon(validIcon({ license: 'WTFPL' }));
  assert.equal(mentions(inconnue, 'license'), true);

  const incoherente = validateIcon(validIcon({ source: 'yotopixels', license: 'CC-BY-NC' }));
  assert.equal(mentions(incoherente, 'licence'), true);
});

test('validateIcon : downloads doit être un nombre positif', () => {
  assert.equal(mentions(validateIcon(validIcon({ downloads: -1 })), 'downloads'), true);
  assert.equal(mentions(validateIcon(validIcon({ downloads: '3' })), 'downloads'), true);
  assert.equal(mentions(validateIcon(validIcon({ downloads: undefined })), 'downloads'), true);
});

test('validateIcon : tags doit être un tableau de chaînes', () => {
  assert.equal(mentions(validateIcon(validIcon({ tags: 'star' })), 'tags'), true);
  assert.equal(mentions(validateIcon(validIcon({ tags: ['ok', 3] })), 'tags'), true);
});

test('validateIcon : date_added et URLs sont contrôlés', () => {
  assert.equal(
    mentions(validateIcon(validIcon({ date_added: 'pas-une-date' })), 'date_added'),
    true
  );
  assert.equal(
    mentions(validateIcon(validIcon({ preview_image: 'ftp://x' })), 'preview_image'),
    true
  );
  assert.equal(mentions(validateIcon(validIcon({ download_url: 'x.png' })), 'download_url'), true);
});

test('validateIcon : metadata doit être un objet portant source_id', () => {
  assert.equal(mentions(validateIcon(validIcon({ metadata: [] })), 'metadata'), true);
  assert.equal(mentions(validateIcon(validIcon({ metadata: 'x' })), 'metadata'), true);
  assert.equal(mentions(validateIcon(validIcon({ metadata: undefined })), 'metadata'), true);
  assert.equal(mentions(validateIcon(validIcon({ metadata: {} })), 'source_id'), true);
  assert.equal(
    mentions(validateIcon(validIcon({ metadata: { source_id: '  ' } })), 'source_id'),
    true
  );
  assert.deepEqual(validateIcon(validIcon({ metadata: { source_id: '2706' } })), []);
});

// ---------------------------------------------------------------------------
// validateIcons
// ---------------------------------------------------------------------------

test('validateIcons : catalogue conforme → valide', () => {
  const result = validateIcons([validIcon({ id: cid('a') }), validIcon({ id: cid('b') })]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateIcons : détecte les identifiants dupliqués', () => {
  const result = validateIcons([validIcon({ id: cid('dup') }), validIcon({ id: cid('dup') })]);
  assert.equal(result.valid, false);
  assert.equal(mentions(result.errors, 'id dupliqué'), true);
});

test('validateIcons : préfixe chaque erreur par l’identifiant de l’icône', () => {
  const broken = cid('broken');
  const result = validateIcons([validIcon({ id: broken, category: 'zzz' })]);
  assert.equal(result.valid, false);
  assert.equal(mentions(result.errors, broken), true);
});

test('validateIcons : refuse un catalogue vide ou non-tableau', () => {
  assert.equal(validateIcons([]).valid, false);
  assert.equal(mentions(validateIcons([]).errors, 'vide'), true);
  assert.equal(validateIcons(null).valid, false);
});

// ---------------------------------------------------------------------------
// validateSummary
// ---------------------------------------------------------------------------

test('validateSummary : résumé conforme → valide', () => {
  const result = validateSummary(validSummary(), { expectedTotal: 2 });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateSummary : vérifie schemaVersion et les dates', () => {
  assert.equal(validateSummary(validSummary({ schemaVersion: 1 })).valid, false);
  assert.equal(
    mentions(validateSummary(validSummary({ updatedAt: 'nope' })).errors, 'updatedAt'),
    true
  );
});

test('validateSummary : `total` doit être cohérent avec le catalogue', () => {
  const result = validateSummary(validSummary({ total: 5 }), { expectedTotal: 2 });
  assert.equal(result.valid, false);
  assert.equal(mentions(result.errors, 'total'), true);
});

test('validateSummary : counts.bySource doit couvrir les 3 sources et sommer au total', () => {
  const incomplet = validSummary({
    counts: { bySource: { yotopixels: 2 }, byCategory: {} },
  });
  assert.equal(mentions(validateSummary(incomplet).errors, 'yotoicons'), true);

  const incoherent = validSummary({
    counts: {
      bySource: { yotopixels: 5, yotoicons: 5, 'yoto-official': 0 },
      byCategory: {},
    },
  });
  assert.equal(mentions(validateSummary(incoherent).errors, 'somme'), true);
});

test('validateSummary : exige le bloc duplicates', () => {
  assert.equal(
    mentions(validateSummary(validSummary({ duplicates: undefined })).errors, 'duplicates'),
    true
  );
  assert.equal(validateSummary(validSummary({ duplicates: { groups: 0, icons: 0 } })).valid, true);
});

// ---------------------------------------------------------------------------
// validateManifest
// ---------------------------------------------------------------------------

test('validateManifest : manifeste conforme → valide', () => {
  assert.equal(validateManifest(validManifest(), { expectedTotal: 2 }).valid, true);
});

test('validateManifest : exige les références shards/searchIndex/summary', () => {
  assert.equal(
    mentions(validateManifest(validManifest({ searchIndex: undefined })).errors, 'searchIndex'),
    true
  );
  assert.equal(
    mentions(validateManifest(validManifest({ summary: undefined })).errors, 'summary'),
    true
  );
  assert.equal(mentions(validateManifest(validManifest({ shards: [] })).errors, 'shards'), true);
});

test('validateManifest : un sha256 doit faire 64 caractères hexadécimaux', () => {
  const bad = validManifest({
    shards: [{ path: 'icons.json', type: 'full', count: 2, bytes: 10, sha256: 'trop-court' }],
  });
  assert.equal(mentions(validateManifest(bad).errors, 'sha256'), true);
});

test('validateManifest : la liste des sources doit couvrir les 3 sources', () => {
  const bad = validManifest({ sources: [{ id: 'yotopixels', count: 2 }] });
  assert.equal(mentions(validateManifest(bad).errors, 'yotoicons'), true);
});

// ---------------------------------------------------------------------------
// assertValidCatalogue
// ---------------------------------------------------------------------------

test('assertValidCatalogue : ne lève rien pour un ensemble valide', () => {
  assert.doesNotThrow(() =>
    assertValidCatalogue({
      icons: [
        validIcon({ id: cid('a') }),
        validIcon({
          id: cid('b'),
          source: 'yotoicons',
          license: 'CC-BY-NC',
          subcategory: 'autre',
          metadata: { source_id: '2706' },
        }),
      ],
      summary: validSummary(),
      manifest: validManifest(),
    })
  );
});

test('assertValidCatalogue : lève une erreur lisible et tronquée sinon', () => {
  assert.throws(
    () => assertValidCatalogue({ icons: [validIcon({ id: cid('x'), category: 'zzz' })] }),
    (error) => {
      assert.match(error.message, /Catalogue invalide/);
      assert.match(error.message, /category/);
      return true;
    }
  );
});
