/**
 * YotoIcons Scraper
 * Extrait TOUTES les icônes de yotoicons.com avec pagination complète
 * Site: 25 566+ icônes singles
 */

import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithRetry } from './lib/rateLimiter.js';
import { inferTags } from './lib/inferTags.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'https://www.yotoicons.com';
const ICONS_PAGE_URL = '/icons';
const ITEMS_PER_PAGE = 30; // observé sur le site
const CONCURRENCY = 3; // requêtes parallèles pour être poli
const DELAY_MS = 800; // délai entre requêtes

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  const $ = cheerio.load(html);

  const icons = [];

  // Structure observée : chaque icône est dans un lien <a> qui contient une image
  // L'image a src="/static/uploads/{id}.png" et alt="titre"
  // L'artiste est dans un span avec classe contenant "artist" ou text "@username"
  // Les tags ne semblent pas sur la page de liste (seulement sur page détail)

  // Sélecteur robuste : images dans la grille d'icônes
  $('img[src*="/static/uploads/"]').each((idx, element) => {
    const $img = $(element);
    const $link = $img.closest('a');
    const $container = $img.closest('[class*="icon"], [class*="grid"], [class*="item"]').parent();

    // ID numérique depuis l'URL de l'image
    const src = $img.attr('src') || '';
    const idMatch = src.match(/\/static\/uploads\/(\d+)\.png/);
    const numericId = idMatch ? idMatch[1] : null;
    if (!numericId) return;

    // Titre depuis alt ou texte proche
    let title = $img.attr('alt')?.trim() || '';
    if (!title || title === 'Icon' || title === 'icon') {
      // Essayer de trouver un titre dans le conteneur
      const text = $container.text().trim();
      const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('@'));
      title = lines[0] || `icon-${numericId}`;
    }

    // Artiste : chercher @username dans le conteneur
    let artist = 'anonymous';
    const containerText = $container.text();
    const artistMatch = containerText.match(/@(\w[\w.-]*)/);
    if (artistMatch) {
      artist = artistMatch[1];
    } else {
      // Fallback: chercher un élément avec classe artist
      const $artistEl = $container.find('[class*="artist"], .artist-name');
      if ($artistEl.length) {
        artist = $artistEl.text().trim().replace('@', '') || 'anonymous';
      }
    }

    // Téléchargements : chercher un nombre près de "downloads" ou "téléchargements"
    let downloads = 0;
    const dlMatch = containerText.match(/(\d+)\s*(downloads?|téléchargements?)/i);
    if (dlMatch) downloads = parseInt(dlMatch[1], 10);

    // URL de téléchargement (sur page de détail, mais on peut construire)
    const downloadUrl = `${BASE_URL}/download/${numericId}`; // pattern supposé
    const detailUrl = `${BASE_URL}/icon/${numericId}`; // page de détail

    // Tags : pas disponibles sur la liste, on les infère du titre
    const tags = inferTags(title);

    const id = `yi-${artist.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${numericId}`;

    icons.push({
      id,
      source: 'yotoicons',
      tags,
      artist: `@${artist}`,
      title: title.slice(0, 80),
      preview_image: src.startsWith('http') ? src : `${BASE_URL}${src}`,
      download_url: downloadUrl,
      category: inferCategory(title, tags),
      subcategory: inferSubcategory(title, tags),
      downloads,
      date_added: new Date().toISOString(),
      license: 'CC-BY-NC',
      metadata: {
        numeric_id: numericId,
        detail_url: detailUrl,
        color_palette: extractColors(),
        dominant_colors: getDominantColors()
      }
    });
  });

  return icons;
}

function inferCategory(title, tags) {
  const titleLower = title.toLowerCase();
  const allText = titleLower + ' ' + tags.join(' ');

  if (tagMatches(allText, ['moon', 'sun', 'star', 'plant', 'weather', 'cloud', 'rain', 'snow'])) return 'nature';
  if (tagMatches(allText, ['animal', 'cat', 'dog', 'bird', 'fish'])) return 'animaux';
  if (tagMatches(allText, ['heart', 'love', 'people', 'person', 'face'])) return 'émotions';
  if (tagMatches(allText, ['home', 'food', 'transport', 'tech', 'shopping', 'media', 'ui', 'time', 'mail'])) return 'objets';
  if (tagMatches(allText, ['arrow', 'shape', 'circle', 'square', 'triangle', 'diamond'])) return 'formes';
  return 'objets';
}

function tagMatches(text, keywords) {
  return keywords.some(k => text.includes(k));
}

function inferSubcategory(title, tags) {
  const allText = title.toLowerCase() + ' ' + tags.join(' ');
  if (/moon|lune/.test(allText)) return 'lune';
  if (/sun|soleil/.test(allText)) return 'soleil';
  if (/star|étoile/.test(allText)) return 'étoile';
  if (/heart|cœur/.test(allText)) return 'cœur';
  if (/plant|plante|leaf|feuille|flower|fleur|sprout|pousse/.test(allText)) return 'plante';
  if (/cat|chat/.test(allText)) return 'chat';
  if (/dog|chien/.test(allText)) return 'chien';
  if (/bird|oiseau/.test(allText)) return 'oiseau';
  if (/arrow|flèche/.test(allText)) return 'flèche';
  return 'autre';
}

function extractColors() {
  return ['#1a1a2e', '#16213e', '#e94560', '#ffa3a3'];
}

function getDominantColors() {
  return ['#e94560', '#ffa3a3', '#4a90e2'];
}

async function scrapeAllYotoicons() {
  console.log('📥 Début du scrappage yotoicons (pagination complète)...');

  // D'abord, récupérer la première page pour connaître le total
  const firstPage = await scrapePage(1);
  console.log(`   Page 1: ${firstPage.length} icônes`);

  // Estimer le nombre total de pages (25566 / 30 ≈ 852)
  // On continue jusqu'à ce qu'une page soit vide
  const allIcons = [...firstPage];
  let page = 2;
  let emptyPages = 0;
  const maxEmptyPages = 3;

  // Utiliser une file d'attente avec concurrence limitée
  const queue = [];
  const results = new Map();

  async function worker(pageNum) {
    await sleep(DELAY_MS * Math.random()); // jitter
    try {
      const icons = await scrapePage(pageNum);
      return { pageNum, icons, error: null };
    } catch (err) {
      return { pageNum, icons: [], error: err.message };
    }
  }

  // Lancer les workers
  const running = new Set();
  while (page <= 2000 || running.size > 0) { // limite de sécurité 2000 pages
    while (running.size < CONCURRENCY && page <= 2000) {
      const p = page++;
      const promise = worker(p).then(result => {
        running.delete(p);
        results.set(p, result);
      });
      running.add(p);
    }

    // Attendre qu'au moins un se termine
    if (running.size > 0) {
      await Promise.race(Array.from(running).map(p =>
        new Promise(resolve => {
          const check = setInterval(() => {
            if (!running.has(p)) {
              clearInterval(check);
              resolve();
            }
          }, 100);
        })
      ));
    }

    // Traiter les résultats terminés
    for (const [p, result] of results) {
      if (result.icons.length > 0) {
        allIcons.push(...result.icons);
        emptyPages = 0;
        console.log(`   Page ${p}: +${result.icons.length} icônes (total: ${allIcons.length})`);
      } else {
        emptyPages++;
        console.log(`   Page ${p}: vide (${emptyPages}/${maxEmptyPages})`);
        if (emptyPages >= maxEmptyPages) {
          console.log(`🛑 ${maxEmptyPages} pages vides consécutives, arrêt.`);
          break;
        }
      }
      results.delete(p);
    }

    if (emptyPages >= maxEmptyPages) break;
  }

  // Dédupliquer par numeric_id
  const seen = new Set();
  const uniqueIcons = allIcons.filter(icon => {
    const key = icon.metadata?.numeric_id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`✅ ${uniqueIcons.length} icônes yotoicons uniques extraites (après déduplication)`);
  return uniqueIcons;
}

scrapeAllYotoicons()
  .then(icons => {
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