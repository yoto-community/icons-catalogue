/**
 * Build API - Génère la structure dist/ style podcast-catalogue
 * pour l'API statique du catalogue d'icônes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import lunr from 'lunr';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const UNIFIED_SEARCH_PUBLIC = path.join(__dirname, '..', 'unified-search', 'public');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    console.warn(`⚠️ Fichier non trouvé: ${filepath}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function writeJSON(filepath, data) {
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filepath, content);
  return { bytes: Buffer.byteLength(content, 'utf8'), sha256: sha256(content) };
}

console.log('🔨 Début de la construction de l\'API (dist/)...');

// 1. Charger les données brutes
const yotopixelsData = loadJSON('yotopixels-icons.json');
const yotoiconsData = loadJSON('yotoicons-icons.json');
const yotoOfficialData = loadJSON('yoto-official-icons.json');

console.log(`📊 ${yotopixelsData.length} icônes yotopixels + ${yotoiconsData.length} icônes yotoicons + ${yotoOfficialData.length} icônes yoto-official`);

const allIcons = [...yotopixelsData, ...yotoiconsData, ...yotoOfficialData];

if (allIcons.length === 0) {
  console.error('❌ Aucune icône trouvée. Lancez d\'abord les scrapers.');
  process.exit(1);
}

// 2. Construire l'index Lunr
const index = lunr(function () {
  this.ref('id');
  this.field('tags', { boost: 10 });
  this.field('artist');
  this.field('title');
  this.field('source');
  this.field('category');
  this.field('subcategory');

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

const indexJSON = index.toJSON();
const indexContent = JSON.stringify(indexJSON);

// 3. Créer les dossiers
ensureDir(DIST_DIR);
ensureDir(path.join(DIST_DIR, 'icons'));
ensureDir(path.join(DIST_DIR, 'icons-by-source'));
ensureDir(path.join(DIST_DIR, 'icons-by-category'));

// 4. Écrire les icônes individuelles
console.log('📝 Écriture des icônes individuelles...');
const iconShards = [];
for (const icon of allIcons) {
  const iconPath = path.join(DIST_DIR, 'icons', `${icon.id}.json`);
  const meta = writeJSON(iconPath, icon);
  iconShards.push({
    id: icon.id,
    path: `icons/${icon.id}.json`,
    source: icon.source,
    category: icon.category,
    ...meta
  });
}

// 5. Écrire le catalogue complet (icons.json)
console.log('📝 Écriture du catalogue complet...');
const fullCatalog = allIcons.map(icon => ({
  id: icon.id,
  source: icon.source,
  tags: icon.tags,
  artist: icon.artist,
  title: icon.title,
  preview_image: icon.preview_image,
  download_url: icon.download_url,
  category: icon.category,
  subcategory: icon.subcategory,
  downloads: icon.downloads || 0,
  date_added: icon.date_added,
  license: icon.license,
  metadata: icon.metadata
}));

const fullMeta = writeJSON(path.join(DIST_DIR, 'icons.json'), fullCatalog);

// 6. Écrire les shards par source
console.log('📝 Écriture des shards par source...');
const sources = ['yotopixels', 'yotoicons', 'yoto-official'];
const sourceShards = [];

for (const source of sources) {
  const sourceIcons = allIcons.filter(i => i.source === source);
  const sourcePath = path.join(DIST_DIR, 'icons-by-source', `${source}.json`);
  const meta = writeJSON(sourcePath, sourceIcons.map(icon => ({
    id: icon.id,
    source: icon.source,
    tags: icon.tags,
    artist: icon.artist,
    title: icon.title,
    preview_image: icon.preview_image,
    download_url: icon.download_url,
    category: icon.category,
    subcategory: icon.subcategory,
    downloads: icon.downloads || 0,
    date_added: icon.date_added,
    license: icon.license,
    metadata: icon.metadata
  })));
  sourceShards.push({
    path: `icons-by-source/${source}.json`,
    source,
    count: sourceIcons.length,
    ...meta
  });
}

// 7. Écrire les shards par catégorie
console.log('📝 Écriture des shards par catégorie...');
const categories = [...new Set(allIcons.map(i => i.category))].sort();
const categoryShards = [];

for (const category of categories) {
  const catIcons = allIcons.filter(i => i.category === category);
  const catPath = path.join(DIST_DIR, 'icons-by-category', `${category}.json`);
  const meta = writeJSON(catPath, catIcons.map(icon => ({
    id: icon.id,
    source: icon.source,
    tags: icon.tags,
    artist: icon.artist,
    title: icon.title,
    preview_image: icon.preview_image,
    download_url: icon.download_url,
    category: icon.category,
    subcategory: icon.subcategory,
    downloads: icon.downloads || 0,
    date_added: icon.date_added,
    license: icon.license,
    metadata: icon.metadata
  })));
  categoryShards.push({
    path: `icons-by-category/${category}.json`,
    category,
    count: catIcons.length,
    ...meta
  });
}

// 8. Écrire l'index de recherche
console.log('📝 Écriture de l\'index de recherche...');
const searchIndexMeta = writeJSON(path.join(DIST_DIR, 'search-index.json'), indexJSON);

// 9. Calculer les statistiques
const bySource = {};
const byCategory = {};
const byArtist = {};
const bySubcategory = {};
const tagsCount = {};

for (const icon of allIcons) {
  bySource[icon.source] = (bySource[icon.source] || 0) + 1;
  byCategory[icon.category] = (byCategory[icon.category] || 0) + 1;
  byArtist[icon.artist] = (byArtist[icon.artist] || 0) + 1;
  if (icon.subcategory) {
    bySubcategory[icon.subcategory] = (bySubcategory[icon.subcategory] || 0) + 1;
  }
  icon.tags.forEach(tag => {
    tagsCount[tag] = (tagsCount[tag] || 0) + 1;
  });
}

const topTags = Object.entries(tagsCount)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 50)
  .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

const topArtists = Object.entries(byArtist)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 50)
  .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});

// 10. Écrire le résumé
console.log('📝 Écriture du résumé...');
const summary = {
  schemaVersion: 2,
  catalogVersion: new Date().toISOString().split('T')[0].replace(/-/g, '.') + '-1',
  updatedAt: new Date().toISOString(),
  total: allIcons.length,
  counts: {
    bySource,
    byCategory,
    bySubcategory,
    topTags,
    topArtists
  }
};
const summaryMeta = writeJSON(path.join(DIST_DIR, 'summary.json'), summary);

// 11. Construire le manifeste (index.json)
console.log('📝 Écriture du manifeste...');
const manifest = {
  schemaVersion: 2,
  catalogVersion: summary.catalogVersion,
  updatedAt: summary.updatedAt,
  counts: {
    total: allIcons.length,
    bySource,
    byCategory
  },
  sources: sources.map(source => ({
    id: source,
    count: bySource[source] || 0
  })),
  categories: categories.map(cat => ({
    id: cat,
    count: byCategory[cat] || 0
  })),
  shards: [
    {
      path: 'icons.json',
      type: 'full',
      count: allIcons.length,
      ...fullMeta
    },
    ...sourceShards.map(s => ({
      path: s.path,
      type: 'source',
      source: s.source,
      count: s.count,
      bytes: s.bytes,
      sha256: s.sha256
    })),
    ...categoryShards.map(s => ({
      path: s.path,
      type: 'category',
      category: s.category,
      count: s.count,
      bytes: s.bytes,
      sha256: s.sha256
    }))
  ],
  searchIndex: {
    path: 'search-index.json',
    ...searchIndexMeta
  },
  summary: {
    path: 'summary.json',
    ...summaryMeta
  }
};

writeJSON(path.join(DIST_DIR, 'index.json'), manifest);

// 12. Copier vers unified-search/public pour compatibilité
console.log('📝 Synchronisation vers unified-search/public...');
ensureDir(UNIFIED_SEARCH_PUBLIC);

// Copier les fichiers principaux
fs.copyFileSync(
  path.join(DIST_DIR, 'icons.json'),
  path.join(UNIFIED_SEARCH_PUBLIC, 'combined-icons.json')
);
fs.copyFileSync(
  path.join(DIST_DIR, 'search-index.json'),
  path.join(UNIFIED_SEARCH_PUBLIC, 'lunr-index.bin')
);
fs.copyFileSync(
  path.join(DIST_DIR, 'summary.json'),
  path.join(UNIFIED_SEARCH_PUBLIC, 'summary-combined.json')
);

// 13. Générer un fichier de test HTML
const testHtml = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>API Yoto Icons - Test</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
  .stat { display: inline-block; background: #f5f5f5; padding: 0.5rem 1rem; margin: 0.25rem; border-radius: 4px; }
  .stat strong { color: #333; }
  table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #eee; }
  th { background: #fafafa; }
</style></head><body>
<h1>API Yoto Icons - Test</h1>
<p>Catalogue de <strong>${allIcons.length}</strong> icônes 16×16</p>
<div>
  <span class="stat">Sources: ${Object.entries(bySource).map(([k,v]) => `${k}: ${v}`).join(', ')}</span>
  <span class="stat">Catégories: ${categories.length}</span>
  <span class="stat">Artistes: ${Object.keys(byArtist).length}</span>
</div>
<h2>Répartition par source</h2>
<table>
  <tr><th>Source</th><th>Nombre</th></tr>
  ${Object.entries(bySource).map(([source, count]) => `<tr><td>${source}</td><td>${count}</td></tr>`).join('')}
</table>
<h2>Répartition par catégorie</h2>
<table>
  <tr><th>Catégorie</th><th>Nombre</th></tr>
  ${Object.entries(byCategory).sort((a,b) => b[1]-a[1]).map(([cat, count]) => `<tr><td>${cat}</td><td>${count}</td></tr>`).join('')}
</table>
<h2>Top 10 tags</h2>
<table>
  <tr><th>Tag</th><th>Nombre</th></tr>
  ${Object.entries(topTags).slice(0, 10).map(([tag, count]) => `<tr><td>${tag}</td><td>${count}</td></tr>`).join('')}
</table>
<h2>Endpoints API</h2>
<ul>
  <li><code>GET /dist/index.json</code> - Manifeste</li>
  <li><code>GET /dist/icons.json</code> - Catalogue complet</li>
  <li><code>GET /dist/icons/{id}.json</code> - Métadonnées d'une icône</li>
  <li><code>GET /dist/icons-by-source/{source}.json</code> - Icônes par source</li>
  <li><code>GET /dist/icons-by-category/{category}.json</code> - Icônes par catégorie</li>
  <li><code>GET /dist/search-index.json</code> - Index Lunr</li>
  <li><code>GET /dist/summary.json</code> - Statistiques</li>
</ul>
</body></html>`;

fs.writeFileSync(path.join(DIST_DIR, 'test-index.html'), testHtml);
fs.writeFileSync(path.join(UNIFIED_SEARCH_PUBLIC, 'test-index.html'), testHtml);

console.log('✅ API construite avec succès !');
console.log(`   - Total icônes: ${allIcons.length}`);
console.log(`   - Dossier: ${DIST_DIR}`);
console.log(`   - Fichiers individuels: ${iconShards.length} dans dist/icons/`);
console.log(`   - Shards par source: ${sourceShards.length}`);
console.log(`   - Shards par catégorie: ${categoryShards.length}`);
console.log('   - Manifeste: dist/index.json');
console.log('   - Index recherche: dist/search-index.json');
console.log('   - Résumé: dist/summary.json');
console.log('   - Compatibilité unified-search: OK');