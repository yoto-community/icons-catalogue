/**
 * Build Combiné - Fusionne les deux sources en un index unique pour GitHub Pages
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import lunr from 'lunr';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'unified-search', 'public');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('🔨 Début de la construction de l\'index combiné...');

function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️ Fichier non trouvé: ${filepath}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

const yotopixelsData = loadJSON('yotopixels-icons.json');
const yotoiconsData = loadJSON('yotoicons-icons.json');
const yotoOfficialData = loadJSON('yoto-official-icons.json');

console.log(`📊 ${yotopixelsData.length} icônes yotopixels + ${yotoiconsData.length} icônes yotoicons + ${yotoOfficialData.length} icônes yoto-official`);

const allIcons = [...yotopixelsData, ...yotoiconsData, ...yotoOfficialData];

if (allIcons.length === 0) {
  console.error('❌ Aucune icône trouvée. Lancez d\'abord les scrapers.');
  process.exit(1);
}

const index = lunr(function () {
  this.ref('id');
  this.field('tags', { boost: 10 });
  this.field('artist');
  this.field('title');
  this.field('source');

  allIcons.forEach(icon => {
    this.add({
      id: icon.id,
      tags: icon.tags,
      artist: icon.artist,
      title: icon.title,
      source: icon.source,
      downloads: icon.downloads || 0,
      category: icon.category,
      subcategory: icon.subcategory
    });
  });
});

const indexPath = path.join(OUTPUT_DIR, 'lunr-index.bin');
fs.writeFileSync(indexPath, JSON.stringify(index.toJSON()));
console.log(`💾 Index Lunr généré: ${indexPath}`);

const simplifiedIndex = allIcons.map(icon => ({
  id: icon.id,
  source: icon.source,
  tags: icon.tags,
  artist: icon.artist,
  title: icon.title,
  preview_image: icon.preview_image,
  download_url: icon.download_url,
  category: icon.category,
  subcategory: icon.subcategory,
  downloads: icon.downloads || 0
}));

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'combined-icons.json'),
  JSON.stringify(simplifiedIndex, null, 2)
);

const combinedSummary = {
  total: allIcons.length,
  bySource: {
    yotopixels: yotopixelsData.length,
    yotoicons: yotoiconsData.length,
    'yoto-official': yotoOfficialData.length
  },
  byCategory: {},
  byArtist: {},
  topTags: {}
};

allIcons.forEach(icon => {
  combinedSummary.byCategory[icon.category] = (combinedSummary.byCategory[icon.category] || 0) + 1;
  combinedSummary.byArtist[icon.artist] = (combinedSummary.byArtist[icon.artist] || 0) + 1;
  icon.tags.forEach(tag => {
    combinedSummary.topTags[tag] = (combinedSummary.topTags[tag] || 0) + 1;
  });
});

combinedSummary.topTagsSorted = Object.entries(combinedSummary.topTags)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'summary-combined.json'),
  JSON.stringify(combinedSummary, null, 2)
);

console.log('✅ Index combiné créé avec succès !');
console.log(`   - Total icônes: ${combinedSummary.total}`);
console.log(`   - Sources: yotopixels (${combinedSummary.bySource.yotopixels}) + yotoicons (${combinedSummary.bySource.yotoicons}) + yoto-official (${combinedSummary.bySource['yoto-official']})`);
console.log('   - Index Lunr généré: lunr-index.bin');
console.log('   - Résumé: summary-combined.json');

const testHtml = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Test Index Yoto Icons</title></head><body>
<h1>Index Yoto Icons - Test</h1>
<p>Index combiné de <strong>${combinedSummary.total}</strong> icônes</p>
<ul>
${Object.entries(combinedSummary.topTagsSorted).slice(0, 5).map(([tag, count]) => `<li><strong>${tag}</strong>: ${count} icônes</li>`).join('')}
</ul>
</body></html>`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'test-index.html'), testHtml);
console.log('📄 Fichier de test généré: test-index.html');