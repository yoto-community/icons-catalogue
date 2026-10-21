/**
 * Yoto Official Icons Scraper
 * Extrait les icônes officielles de yoto.dev : le bundle JS d'icônes est
 * **découvert depuis la page** (son nom contient un hash de contenu qui change à
 * chaque redéploiement), puis parsé.
 *
 * Source: https://yoto.dev/icons/using-icons/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithRetry } from './lib/rateLimiter.js';
import {
  findBundleUrl,
  extractRawIcons,
  toNormalizedIcons,
  YOTO_DEV_ICONS_PAGE,
} from './lib/yoto-official.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function scrapeYotoOfficial() {
  console.log("📥 Début du scrappage des icônes officielles Yoto (découverte du bundle)…");

  // 1. Récupérer la page qui référence le bundle.
  const pageRes = await fetchWithRetry(YOTO_DEV_ICONS_PAGE, {}, { retries: 3, baseDelayMs: 1000 });
  if (!pageRes.ok) throw new Error(`HTTP ${pageRes.status} pour ${YOTO_DEV_ICONS_PAGE}`);
  const pageHtml = await pageRes.text();

  // 2. Découvrir l'URL du bundle (jamais codée en dur : le hash change).
  const bundleUrl = findBundleUrl(pageHtml, YOTO_DEV_ICONS_PAGE);
  if (!bundleUrl) {
    throw new Error(
      `Bundle d'icônes introuvable sur ${YOTO_DEV_ICONS_PAGE} ` +
        '(page vide, blocage réseau ou structure du site modifiée).'
    );
  }
  console.log(`✅ Bundle découvert : ${bundleUrl}`);

  // 3. Récupérer et parser le bundle.
  const bundleRes = await fetchWithRetry(bundleUrl, {}, { retries: 3, baseDelayMs: 1000 });
  if (!bundleRes.ok) throw new Error(`HTTP ${bundleRes.status} pour ${bundleUrl}`);
  const bundleJs = await bundleRes.text();

  const rawIcons = extractRawIcons(bundleJs);
  console.log(`✅ ${rawIcons.length} icônes officielles Yoto extraites du bundle`);

  // 4. Convertir au format commun.
  const icons = toNormalizedIcons(rawIcons, new Date().toISOString());
  console.log(`✅ ${icons.length} icônes converties au format commun`);
  return icons;
}

// Exécution
scrapeYotoOfficial()
  .then((icons) => {
    const outputPath = path.join(__dirname, '..', 'data', 'yoto-official-icons.json');
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(icons, null, 2));
    console.log(`📁 Données icônes officielles Yoto sauvegardées vers ${outputPath}`);
    console.log(`📊 Total icônes: ${icons.length}`);

    const summary = { total: icons.length, byCategory: {}, byArtist: {}, byTag: {} };
    icons.forEach((icon) => {
      summary.byCategory[icon.category] = (summary.byCategory[icon.category] || 0) + 1;
      summary.byArtist[icon.artist] = (summary.byArtist[icon.artist] || 0) + 1;
      icon.tags.forEach((tag) => {
        summary.byTag[tag] = (summary.byTag[tag] || 0) + 1;
      });
    });

    summary.topTags = Object.entries(summary.byTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

    fs.writeFileSync(
      path.join(__dirname, '..', 'data', 'yoto-official-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('📈 Résumé statistique icônes officielles généré');
  })
  .catch((err) => {
    console.error('❌ Erreur during scrappage icônes officielles:', err.message);
    process.exit(1);
  });
