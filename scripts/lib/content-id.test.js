import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  CONTENT_ID_RE,
  contentId,
  contentIdFromMediaId,
  contentIdToHex,
  isContentId,
} from './content-id.js';

test('contentId : base64url(sha256(bytes)), 43 caractères sans padding', () => {
  const id = contentId(Buffer.from('abc'));
  // Vecteur connu : sha256("abc") = ba7816bf…f20015ad.
  assert.equal(id, 'ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0');
  assert.equal(id.length, 43);
  assert.equal(CONTENT_ID_RE.test(id), true);
});

test('contentId : équivalent au digest base64url de crypto', () => {
  const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(
    contentId(bytes),
    crypto.createHash('sha256').update(bytes).digest('base64url')
  );
});

test('contentId : déterministe et sensible au contenu', () => {
  assert.equal(contentId(Buffer.from('a')), contentId(Buffer.from('a')));
  assert.notEqual(contentId(Buffer.from('a')), contentId(Buffer.from('b')));
});

test('contentIdToHex : round-trip avec le digest hexadécimal', () => {
  const bytes = Buffer.from('hola');
  assert.equal(
    contentIdToHex(contentId(bytes)),
    crypto.createHash('sha256').update(bytes).digest('hex')
  );
});

test('contentIdFromMediaId : retourne le mediaId verbatim (aucun ré-encodage)', () => {
  const mediaId = '_WWpLHoOj6iqeREcGkJnGlsis2QSF6znM0UPFdXTjf8';
  assert.equal(contentIdFromMediaId(mediaId), mediaId);
  assert.equal(isContentId(contentIdFromMediaId(mediaId)), true);
});

test('isContentId : accepte un id base64url de 43 caractères, refuse le reste', () => {
  assert.equal(isContentId(contentId(Buffer.from('x'))), true);
  assert.equal(isContentId('_-_'.repeat(14) + 'x'), true); // 43 caractères base64url valides
  assert.equal(isContentId('A'.repeat(42)), false); // trop court
  assert.equal(isContentId('A'.repeat(44)), false); // trop long
  assert.equal(isContentId('a'.repeat(64)), false); // hex, pas base64url de 43
  assert.equal(isContentId('yt-cb239825-6dd8'), false); // ancien format préfixé
  assert.equal(isContentId(undefined), false);
  assert.equal(isContentId(null), false);
  assert.equal(isContentId(42), false);
});
