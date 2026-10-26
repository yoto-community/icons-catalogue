import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findBundleUrl,
  extractRawIcons,
  toNormalizedIcon,
  toNormalizedIcons,
  YOTO_DEV_ICONS_PAGE,
} from './yoto-official.js';

// ---------------------------------------------------------------------------
// findBundleUrl — le hash du bundle change à chaque redéploiement de yoto.dev :
// il doit être découvert depuis la page, jamais codé en dur.
// ---------------------------------------------------------------------------

test('findBundleUrl extrait le chemin du bundle depuis le HTML', () => {
  const html = `
    <!doctype html><html><head>
      <link rel="modulepreload" href="/_astro/Icons.kDw8Dzu-.js">
    </head></html>`;
  assert.equal(
    findBundleUrl(html),
    'https://yoto.dev/_astro/Icons.kDw8Dzu-.js'
  );
});

test('findBundleUrl résout un chemin relatif contre l’URL de la page', () => {
  const html = '<script type="module" src="./_astro/Icons.abc123.js"></script>';
  // Page servie dans un dossier : `./_astro/…` se résout dans ce dossier.
  assert.equal(
    findBundleUrl(html, 'https://yoto.dev/icons/using-icons/'),
    'https://yoto.dev/icons/using-icons/_astro/Icons.abc123.js'
  );
});

test('findBundleUrl renvoie null quand aucun bundle n’est présent', () => {
  assert.equal(findBundleUrl('<html>rien</html>'), null);
  assert.equal(findBundleUrl(undefined), null);
});

test('findBundleUrl accepte plusieurs bundles et prend le premier', () => {
  const html = '<script src="/_astro/Icons.aaa111.js"></script><script src="/_astro/Other.bbb.js"></script>';
  assert.equal(findBundleUrl(html), 'https://yoto.dev/_astro/Icons.aaa111.js');
});

test('YOTO_DEV_ICONS_PAGE pointe la page d’icônes', () => {
  assert.equal(YOTO_DEV_ICONS_PAGE, 'https://yoto.dev/icons/using-icons/');
});

// ---------------------------------------------------------------------------
// extractRawIcons
// ---------------------------------------------------------------------------

test('extractRawIcons lit le JSON embarqué dans le bundle', () => {
  const bundle = 'const l=JSON.parse(`[{"mediaId":"m1","title":"Star","publicTags":["star"]}]`);export{l};';
  const icons = extractRawIcons(bundle);
  assert.equal(icons.length, 1);
  assert.equal(icons[0].mediaId, 'm1');
});

test('extractRawIcons échoue explicitement si le motif attendu disparaît', () => {
  assert.throws(() => extractRawIcons('export const nothing = 1;'), /données d'icônes/i);
});

test('extractRawIcons échoue si le JSON n’est pas un tableau', () => {
  assert.throws(() => extractRawIcons('JSON.parse(`{"a":1}`)'), /tableau/i);
});

// ---------------------------------------------------------------------------
// toNormalizedIcon
// ---------------------------------------------------------------------------

test('toNormalizedIcon produit une icône au schéma commun', () => {
  const mediaId = '_WWpLHoOj6iqeREcGkJnGlsis2QSF6znM0UPFdXTjf8';
  const icon = toNormalizedIcon(
    { mediaId, title: 'Santa', publicTags: ['christmas'] },
    '2026-10-21T00:00:00.000Z'
  );

  // Pour l'officiel, l'id de contenu EST le mediaId (déjà un sha256 base64url).
  assert.equal(icon.id, mediaId);
  assert.equal(icon.source, 'yoto-official');
  assert.equal(icon.artist, 'Yoto');
  assert.equal(icon.license, 'Yoto Official');
  assert.equal(icon.downloads, 0);
  assert.equal(icon.category, 'fetes');
  assert.equal(icon.metadata.official, true);
  assert.equal(icon.metadata.source_id, mediaId);
  assert.equal(icon.metadata.media_id, mediaId);
  assert.equal(icon.metadata.content_encoding, 'base64url');
  assert.equal(icon.date_added, '2026-10-21T00:00:00.000Z');
});

test('toNormalizedIcon construit l’URL CDN quand elle manque', () => {
  const icon = toNormalizedIcon({ mediaId: 'm9', title: 'Star' });
  assert.equal(icon.preview_image, 'https://card-content.yotoplay.com/yoto/m9');
  assert.equal(icon.download_url, icon.preview_image);
});

test('toNormalizedIcon conserve l’URL fournie', () => {
  const icon = toNormalizedIcon({ mediaId: 'm1', title: 'x', url: 'https://cdn/x.png' });
  assert.equal(icon.preview_image, 'https://cdn/x.png');
});

test('toNormalizedIcon conserve le mediaId verbatim (id = mediaId, sans préfixe)', () => {
  const mediaId = 'A'.repeat(43);
  const icon = toNormalizedIcon({ mediaId, title: 'x' });
  assert.equal(icon.id, mediaId);
  assert.equal(icon.metadata.source_id, mediaId);
});

test('toNormalizedIcons ignore les entrées sans mediaId', () => {
  const icons = toNormalizedIcons([
    { mediaId: 'ok', title: 'A' },
    { title: 'sans mediaId' },
    null,
  ]);
  assert.equal(icons.length, 1);
  assert.equal(icons[0].id, 'ok');
  assert.equal(icons[0].metadata.source_id, 'ok');
});
