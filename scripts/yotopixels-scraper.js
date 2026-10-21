/**
 * YotoPixels Scraper - Version optimisée parallèle
 * Extrait les icônes de yotopixels.com via l'API de recherche SvelteKit
 * 55 pages max (55 × 24 = ~1320 icônes)
 *
 * Le parsing (script SvelteKit / repli HTML) et le mapping au schéma commun
 * sont isolés dans `lib/yotopixels.js` (logique pure, testée hors-ligne) ; ce
 * script ne gère que le réseau et l'orchestration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithRetry } from './lib/rateLimiter.js';
import { extractIconsFromHtml, toNormalizedIcons } from './lib/yotopixels.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://yotopixels.com';
const SEARCH_URL = '/search';
const MAX_PAGES = 55;
const BATCH_SIZE = 5; // Requêtes parallèles par lot

async function scrapeYotopixels() {
  console.log('📥 Début du scrappage yotopixels (55 pages max)...');

  // Récupérer toutes les pages en lots parallèles
  const allIcons = [];

  for (let batchStart = 1; batchStart <= MAX_PAGES; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, MAX_PAGES);
    console.log(`  📦 Lot pages ${batchStart}-${batchEnd}...`);

    // Créer les promesses pour ce lot
    const promises = [];
    for (let page = batchStart; page <= batchEnd; page++) {
      promises.push(fetchPage(page));
    }

    // Exécuter le lot en parallèle
    const results = await Promise.allSettled(promises);

    for (let i = 0; i < results.length; i++) {
      const pageNum = batchStart + i;
      const result = results[i];

      if (result.status === 'fulfilled' && result.value.length > 0) {
        allIcons.push(...result.value);
        console.log(`    ✅ Page ${pageNum}: ${result.value.length} icônes`);
      } else if (result.status === 'rejected') {
        console.warn(`    ⚠️ Page ${pageNum} échouée: ${result.reason?.message}`);
      } else {
        console.log(`    📄 Page ${pageNum}: vide`);
      }
    }

    // Petit délai entre les lots
    if (batchEnd < MAX_PAGES) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`✅ ${allIcons.length} icônes yotopixels extraites au total`);

  // Convertir au format commun du catalogue
  return toNormalizedIcons(allIcons);
}

async function fetchPage(page) {
  const url = `${BASE_URL}${SEARCH_URL}?q=&sort=newest&page=${page}`;
  const res = await fetchWithRetry(url, {}, { retries: 3, baseDelayMs: 600 });
  const html = await res.text();
  return extractIconsFromHtml(html);
}

// Exécution
scrapeYotopixels()
  .then((icons) => {
    const outputPath = path.join(__dirname, '..', 'data', 'yotopixels-icons.json');
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(icons, null, 2));
    console.log(`📁 Données yotopixels sauvegardées vers ${outputPath}`);
    console.log(`📊 Total icônes: ${icons.length}`);

    const summary = { total: icons.length, byCategory: {}, byArtist: {} };
    icons.forEach((icon) => {
      summary.byCategory[icon.category] = (summary.byCategory[icon.category] || 0) + 1;
      summary.byArtist[icon.artist] = (summary.byArtist[icon.artist] || 0) + 1;
    });

    fs.writeFileSync(
      path.join(__dirname, '..', 'data', 'yotopixels-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('📈 Résumé statistique généré');
  })
  .catch((err) => {
    console.error('❌ Erreur during scrappage yotopixels:', err.message);
    process.exit(1);
  });
