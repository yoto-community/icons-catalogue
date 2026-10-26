/**
 * YotoIcons Scraper
 * Extrait TOUTES les icônes de yotoicons.com avec pagination complète
 * Site: ~25 600 icônes singles
 *
 * La page liste expose pour chaque icône un appel
 * `populate_icon_modal(id, catégorie, tag1, tag2, auteur, téléchargements)`
 * (cf. `lib/yotoicons.js`) : catégorie, tags, auteur et téléchargements réels
 * en sont extraits, sans requête supplémentaire.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithRetry, RateLimiter } from './lib/rateLimiter.js';
import { parseIconsFromHtml, toNormalizedIcon, buildImageUrl } from './lib/yotoicons.js';
import { hashImages } from './lib/image-hash.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://www.yotoicons.com';
const ICONS_PAGE_URL = '/icons';
const CONCURRENCY = 3; // requêtes parallèles pour être poli
const DELAY_MS = 800; // espacement minimal entre deux requêtes
const MAX_PAGES = 2000; // garde-fou : arrête une pagination qui ne se termine pas
const MAX_EMPTY_PAGES = 3; // pages vides consécutives avant arrêt

async function scrapePage(pageNum, tag = '', sort = 'popular', type = 'singles') {
  const url = `${BASE_URL}${ICONS_PAGE_URL}?tag=${encodeURIComponent(tag)}&sort=${sort}&type=${type}&page=${pageNum}`;
  const res = await fetchWithRetry(
    url,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; YotoIconsCatalogue/1.0; +https://github.com/yoto-community/icons-catalogue)',
      },
    },
    { retries: 3, baseDelayMs: 800 }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status} pour page ${pageNum}`);

  const html = await res.text();
  // Fiches brutes uniquement : l'identifiant de contenu (donc le téléchargement
  // de l'image) est résolu après la collecte complète.
  return parseIconsFromHtml(html);
}

async function scrapeAllYotoicons() {
  console.log('📥 Début du scrappage yotoicons (pagination complète)...');

  const limiter = new RateLimiter({ maxConcurrent: CONCURRENCY, minDelayMs: DELAY_MS });
  const allIcons = [];
  const seen = new Set();

  // Fenêtre glissante : au plus CONCURRENCY requêtes en vol, mais les
  // résultats sont consommés DANS L'ORDRE des pages — indispensable pour
  // compter correctement les pages vides consécutives.
  const inFlight = new Map(); // numéro de page → promesse d'icônes
  let nextPage = 1;
  let consecutiveEmpty = 0;

  const launch = (pageNum) => {
    const promise = limiter.schedule(() => scrapePage(pageNum)).catch((err) => {
      console.warn(`   ⚠️ Page ${pageNum} échouée: ${err.message}`);
      return [];
    });
    inFlight.set(pageNum, promise);
  };

  while (nextPage <= MAX_PAGES && inFlight.size < CONCURRENCY) {
    launch(nextPage++);
  }

  while (inFlight.size > 0) {
    const pageNum = Math.min(...inFlight.keys());
    const icons = await inFlight.get(pageNum);
    inFlight.delete(pageNum);

    let added = 0;
    for (const icon of icons) {
      const key = icon.id;
      if (key) {
        if (seen.has(key)) continue;
        seen.add(key);
      }
      allIcons.push(icon);
      added++;
    }

    if (icons.length === 0) {
      consecutiveEmpty++;
      console.log(`   Page ${pageNum}: vide (${consecutiveEmpty}/${MAX_EMPTY_PAGES})`);
    } else {
      consecutiveEmpty = 0;
      console.log(`   Page ${pageNum}: +${added} icônes (total: ${allIcons.length})`);
    }

    if (consecutiveEmpty >= MAX_EMPTY_PAGES) {
      console.log(`🛑 ${MAX_EMPTY_PAGES} pages vides consécutives, arrêt.`);
      break;
    }

    // Une place s'est libérée : on programme la page suivante.
    if (nextPage <= MAX_PAGES) {
      launch(nextPage++);
    }
  }

  console.log(`✅ ${allIcons.length} icônes yotoicons uniques extraites (après déduplication)`);
  return allIcons;
}

scrapeAllYotoicons()
  .then(async (parsedIcons) => {
    // Identifiant canonique = base64url(sha256(image)) → téléchargement requis.
    console.log(`🔗 Calcul des identifiants de contenu (${parsedIcons.length} images)…`);
    const contentIds = await hashImages(
      parsedIcons.map((parsed) => ({ key: parsed.id, url: buildImageUrl(parsed.id) })),
      { label: 'images yotoicons', concurrency: 6, minDelayMs: 50 }
    );
    const scrapedAt = new Date().toISOString();
    const icons = parsedIcons.map((parsed) =>
      toNormalizedIcon(parsed, { contentId: contentIds.get(parsed.id), scrapedAt })
    );

    const outputPath = path.join(__dirname, '..', 'data', 'yotoicons-icons.json');
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(icons, null, 2));
    console.log(`📁 Données yotoicons sauvegardées vers ${outputPath}`);
    console.log(`📊 Total icônes: ${icons.length}`);

    const summary = { total: icons.length, byCategory: {}, byArtist: {}, byDownloads: {} };
    icons.forEach(icon => {
      summary.byCategory[icon.category] = (summary.byCategory[icon.category] || 0) + 1;
      summary.byArtist[icon.artist] = (summary.byArtist[icon.artist] || 0) + 1;
      summary.byDownloads[icon.downloads] = (summary.byDownloads[icon.downloads] || 0) + 1;
    });

    summary.topDownloads = Object.entries(summary.byDownloads)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    fs.writeFileSync(
      path.join(__dirname, '..', 'data', 'yotoicons-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('📈 Résumé statistique yotoicons généré');
  })
  .catch(err => {
    console.error('❌ Erreur during scrappage yotoicons:', err.message);
    process.exit(1);
  });
