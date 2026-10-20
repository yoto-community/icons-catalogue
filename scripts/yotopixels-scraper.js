/**
 * YotoPixels Scraper - Version optimisée parallèle
 * Extrait les icônes de yotopixels.com via l'API de recherche SvelteKit
 * 55 pages max (55 × 24 = ~1320 icônes)
 */

import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchWithRetry } from './lib/rateLimiter.js';
import { inferTags } from './lib/inferTags.js';

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
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`✅ ${allIcons.length} icônes yotopixels extraites au total`);

  // Convertir au format commun
  return allIcons.map(icon => {
    // L'API yotopixels fournit des tags pour ~la moitié des icônes ; pour les
    // autres (et le repli HTML), on infère depuis le titre. Les tags réels de
    // l'API sont toujours conservés tels quels.
    const apiTags = Array.isArray(icon.tags) ? icon.tags : [];
    const tags = apiTags.length > 0 ? apiTags : inferTags(icon.title);

    return {
      id: `yt-${icon.id}`,
      source: 'yotopixels',
      tags,
      artist: icon.creator?.public_alias || icon.creator?.id || 'anonymous',
      title: icon.title || 'Sans titre',
      preview_image: icon.image_url,
      download_url: icon.image_url,
      category: inferCategory(icon.title, tags),
      subcategory: inferSubcategory(icon.title, tags),
      downloads: icon.download_count || 0,
      date_added: icon.created_at,
      license: 'CC-BY-SC',
      metadata: {
        original_id: icon.id,
        creator_id: icon.creator?.id,
        color_palette: extractColors(icon.image_url),
        dominant_colors: getDominantColors(icon.image_url),
      },
    };
  });
}

async function fetchPage(page) {
  const url = `${BASE_URL}${SEARCH_URL}?q=&sort=newest&page=${page}`;
  const res = await fetchWithRetry(url, {}, { retries: 3, baseDelayMs: 600 });
  const html = await res.text();
  return extractIconsFromHtml(html);
}

function extractIconsFromHtml(html) {
  const $ = cheerio.load(html);

  const scripts = $('script').toArray();

  for (const script of scripts) {
    const content = $(script).html() || '';
    if (content.includes('__sveltekit_') && content.includes('icons')) {
      const icons = extractIconsFromSvelteKitScript(content);
      if (icons && icons.length > 0) {
        return icons;
      }
    }
  }

  return parseIconsFromHtml($);
}

function extractIconsFromSvelteKitScript(content) {
  try {
    const kitStartMatch = content.match(/kit\.start\s*\([^)]*data\s*:\s*(\[[\s\S]*?\])\s*,?\s*form:/);
    if (!kitStartMatch) return [];

    const dataArrayStr = kitStartMatch[1];
    const jsonStr = convertJSArrayToJSON(dataArrayStr);
    const dataArray = JSON.parse(jsonStr);

    for (const item of dataArray) {
      if (item && item.type === 'data' && item.data && Array.isArray(item.data.icons)) {
        return item.data.icons;
      }
    }

    return [];
  } catch (e) {
    return [];
  }
}

function convertJSArrayToJSON(jsArrayStr) {
  return jsArrayStr
    .replace(/"(?:[^"\\]|\\.)*"/g, m => m.replace(/:/g, '\u0001'))
    .replace(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '"$1":')
    .replace(/\u0001/g, ':')
    .replace(/,(\s*[}\]])/g, '$1');
}

function parseIconsFromHtml($) {
  const icons = [];

  $('article a[href^="/icon/"]').each((_, element) => {
    const $article = $(element).closest('article');
    const $img = $article.find('img');
    const $title = $article.find('h2');

    const imageUrl = $img.attr('src') || '';
    const title = $title.text().trim() || 'Sans titre';
    const href = $(element).attr('href') || '';
    const idMatch = href.match(/\/icon\/([a-f0-9-]+)/);
    const id = idMatch ? idMatch[1] : '';

    const downloadLink = $article.find('a[download]').attr('href') || imageUrl;

    if (id && imageUrl) {
      icons.push({
        id,
        title,
        image_url: imageUrl.startsWith('http') ? imageUrl : `https://yotopixels.com${imageUrl}`,
        creator: { id: 'yoto-pixels', public_alias: 'YotoPixels' },
        download_count: 0,
        tags: [],
        created_at: new Date().toISOString(),
        removed: false
      });
    }
  });

  return icons;
}

function inferCategory(title, tags) {
  const titleLower = (title + ' ' + (tags || []).join(' ')).toLowerCase();

  if (/moon|lune|night|nuit|star|étoile/.test(titleLower)) return 'nature';
  if (/animal|animal|poisson|oiseau|chat|chien/.test(titleLower)) return 'animaux';
  if (/cœur|heart|émotion|feeling/.test(titleLower)) return 'émotions';
  if (/voiture|avion|bateau|transport/.test(titleLower)) return 'objets';
  if (/maison|bâtiment|architecture/.test(titleLower)) return 'objets';
  return 'objets';
}

function inferSubcategory(title, tags) {
  const titleLower = (title + ' ' + (tags || []).join(' ')).toLowerCase();

  if (/plein|full/.test(titleLower)) return 'plein';
  if (/croissant|croissant/.test(titleLower)) return 'croissant';
  if (/cœur|heart/.test(titleLower)) return 'cœur';
  if (/étoile|star/.test(titleLower)) return 'étoile';
  return 'autre';
}

function extractColors(imgUrl) {
  return ['#1a1a2e', '#16213e', '#e94560', '#ffa3a3'];
}

function getDominantColors(imgUrl) {
  return ['#e94560', '#ffa3a3', '#4a90e2'];
}

// Exécution
scrapeYotopixels()
  .then(icons => {
    const outputPath = path.join(__dirname, '..', 'data', 'yotopixels-icons.json');
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(icons, null, 2));
    console.log(`📁 Données yotopixels sauvegardées vers ${outputPath}`);
    console.log(`📊 Total icônes: ${icons.length}`);

    const summary = { total: icons.length, byCategory: {}, byArtist: {} };
    icons.forEach(icon => {
      summary.byCategory[icon.category] = (summary.byCategory[icon.category] || 0) + 1;
      summary.byArtist[icon.artist] = (summary.byArtist[icon.artist] || 0) + 1;
    });

    fs.writeFileSync(
      path.join(__dirname, '..', 'data', 'yotopixels-summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('📈 Résumé statistique généré');
  })
  .catch(err => {
    console.error('❌ Erreur during scrappage yotopixels:', err.message);
    process.exit(1);
  });