/**
 * Téléchargement + hachage des images d'icônes (orchestration réseau des
 * scrapers).
 *
 * L'`id` canonique d'une icône étant `base64url(sha256(bytes))`, il faut
 * télécharger l'image pour le calculer — sauf pour `yoto-official`, dont le
 * `mediaId` **est déjà** ce hash (cf. `lib/yoto-official.js`, zéro réseau). Ce
 * module isole la concurrence, l'espacement et les reprises
 * (`lib/rateLimiter.js`) et **échoue fort** si une image reste indisponible :
 * publier un catalogue aux id incohérents serait pire qu'un échec
 * (cf. `docs/analyse-id-sha256.md` §4.3 — pas d'id provisoire).
 */

import { fetchWithRetry, RateLimiter } from './rateLimiter.js';
import { contentId } from './content-id.js';

/** User-Agent commun pour le téléchargement des images. */
export const IMAGE_USER_AGENT =
  'Mozilla/5.0 (compatible; YotoIconsCatalogue/1.0; +https://github.com/yoto-community/icons-catalogue)';

/**
 * Télécharge une image et retourne son identifiant de contenu.
 *
 * @param {string} url
 * @param {{retries?: number, baseDelayMs?: number, timeoutMs?: number}} [options]
 * @returns {Promise<string>} Identifiant de contenu (43 caractères base64url).
 * @throws {Error} Si l'image reste indisponible après reprises.
 */
export async function fetchImageContentId(
  url,
  { retries = 3, baseDelayMs = 500, timeoutMs } = {}
) {
  const res = await fetchWithRetry(
    url,
    { headers: { 'User-Agent': IMAGE_USER_AGENT } },
    { retries, baseDelayMs, timeoutMs }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} pour l'image ${url}`);
  const bytes = Buffer.from(await res.arrayBuffer());
  return contentId(bytes);
}

/**
 * Résout les identifiants de contenu d'un lot d'images, en contrôlant la
 * concurrence et le débit.
 *
 * Toute image définitivement indisponible fait **échouer** l'appel (aucun id
 * provisoire n'est fabriqué) : le catalogue ne doit jamais publier d'id
 * incohérents.
 *
 * @param {Array<{key: string, url: string}>} items - `key` = id natif de source.
 * @param {{concurrency?: number, minDelayMs?: number, label?: string}} [options]
 * @returns {Promise<Map<string, string>>} `key` → identifiant de contenu.
 * @throws {Error} Si au moins une image échoue.
 */
export async function hashImages(items, { concurrency = 6, minDelayMs = 50, label = 'images' } = {}) {
  const limiter = new RateLimiter({ maxConcurrent: concurrency, minDelayMs });
  const contentIds = new Map();
  const failures = [];
  let done = 0;

  await Promise.all(
    items.map((item) =>
      limiter.schedule(async () => {
        try {
          contentIds.set(item.key, await fetchImageContentId(item.url));
        } catch (err) {
          failures.push({ key: item.key, url: item.url, error: err.message });
        }
        done++;
        if (done % 1000 === 0 || done === items.length) {
          console.log(`   … ${done}/${items.length} ${label} hachées`);
        }
      })
    )
  );

  if (failures.length > 0) {
    const sample = failures
      .slice(0, 5)
      .map((failure) => `  - ${failure.key} (${failure.url}) : ${failure.error}`)
      .join('\n');
    throw new Error(
      `${failures.length}/${items.length} image(s) ${label} indisponible(s) après reprises :\n` +
        `${sample}\nAbandon : les id de contenu seraient incomplets ` +
        "(pas d'id provisoire — cf. docs/analyse-id-sha256.md §4.3)."
    );
  }

  return contentIds;
}
