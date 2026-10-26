/**
 * Build API - Génère la structure dist/ style podcast-catalogue
 * pour l'API statique du catalogue d'icônes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import lunr from 'lunr';
import { assertSourcesPresent, assertNoRegression } from './lib/catalogue-guards.js';
import { applySourceLicense } from './lib/source-licenses.js';
import { nextCatalogVersion } from './lib/catalog-version.js';
import { markDuplicates } from './lib/dedupe.js';
import { mergeContentDuplicates } from './lib/content-dedupe.js';
import { validateIcons, validateSummary, validateManifest } from './lib/catalogue-schema.js';
import { isDataSectionInSync, replaceDataSection } from './lib/readme-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DIST_DIR = path.join(__dirname, '..', 'dist');
const SITE_PUBLIC = path.join(__dirname, '..', 'site', 'public');
const README_PATH = path.join(__dirname, '..', 'README.md');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Régénère la section « Données actuelles » du README depuis le résumé (P0.5) :
 * la documentation reste alignée sur le build, sans édition manuelle.
 */
function updateReadmeDataSection(summary) {
  if (!fs.existsSync(README_PATH)) return;
  const readme = fs.readFileSync(README_PATH, 'utf-8');
  if (isDataSectionInSync(readme, summary)) return;
  fs.writeFileSync(README_PATH, replaceDataSection(readme, summary));
  console.log('📄 README : section « Données actuelles » régénérée.');
}

/**
 * Charge un fichier de données **obligatoire**. Un fichier manquant doit faire
 * échouer le build : publier un catalogue amputé serait pire qu'un échec.
 */
function loadRequiredJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(
      `Fichier de données introuvable : ${filepath}. Lancez le scraper correspondant.`
    );
  }
  return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
}

/**
 * Lit le résumé du build précédent, pour détecter une régression forte du
 * catalogue (cf. {@link assertNoRegression}) et calculer la version suivante.
 * @returns {object|null}
 */
function readPreviousSummary() {
  for (const candidate of [
    path.join(SITE_PUBLIC, 'summary.json'),
    path.join(DIST_DIR, 'summary.json'),
  ]) {
    if (!fs.existsSync(candidate)) continue;
    try {
      return JSON.parse(fs.readFileSync(candidate, 'utf-8'));
    } catch {
      // Résumé illisible : on l'ignore (simple référence).
    }
  }
  return null;
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function writeJSON(filepath, data) {
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filepath, content);
  return { bytes: Buffer.byteLength(content, 'utf8'), sha256: sha256(content) };
}

/**
 * Échec explicite : publier un catalogue malformé serait pire qu'un échec.
 * @param {string[]} errors
 */
function failValidation(errors) {
  console.error(`❌ Catalogue invalide (${errors.length} erreur(s)) :`);
  for (const error of errors.slice(0, 20)) console.error(`   - ${error}`);
  if (errors.length > 20) console.error(`   … et ${errors.length - 20} autre(s)`);
  process.exit(1);
}

console.log('🔨 Début de la construction de l\'API (dist/)...');

// 1. Charger les données brutes (échec explicite si une source manque).
let yotopixelsData;
let yotoiconsData;
let yotoOfficialData;
try {
  yotopixelsData = loadRequiredJSON('yotopixels-icons.json');
  yotoiconsData = loadRequiredJSON('yotoicons-icons.json');
  yotoOfficialData = loadRequiredJSON('yoto-official-icons.json');
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}

console.log(`📊 ${yotopixelsData.length} icônes yotopixels + ${yotoiconsData.length} icônes yotoicons + ${yotoOfficialData.length} icônes yoto-official`);

// La licence est (re)appliquée depuis la source unique `source-licenses.js` :
// les données committées peuvent porter d'anciennes valeurs (ex. `CC-BY-SC`)
// qui n'ont pas à être re-scrapées pour être corrigées.
let allIcons = [...yotopixelsData, ...yotoiconsData, ...yotoOfficialData].map(applySourceLicense);

if (allIcons.length === 0) {
  console.error('❌ Aucune icône trouvée. Lancez d\'abord les scrapers.');
  process.exit(1);
}

// 1bis. Garde-fous : chaque source doit être présente et non vide.
const sourceCounts = {
  yotopixels: yotopixelsData.length,
  yotoicons: yotoiconsData.length,
  'yoto-official': yotoOfficialData.length,
};
try {
  assertSourcesPresent(sourceCounts);
} catch (err) {
  console.error(`❌ ${err.message}`);
  process.exit(1);
}

// 1ter. Garde-fou anti-régression : refuser une chute forte vs le build précédent.
const previousSummary = readPreviousSummary();
if (process.env.ALLOW_CATALOGUE_SHRINK === '1') {
  console.warn('⚠️ ALLOW_CATALOGUE_SHRINK=1 : garde-fou anti-régression désactivé.');
} else {
  const previousTotal = typeof previousSummary?.total === 'number' ? previousSummary.total : undefined;
  try {
    assertNoRegression(allIcons.length, previousTotal);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    console.error('   (Définissez ALLOW_CATALOGUE_SHRINK=1 pour forcer, après vérification.)');
    process.exit(1);
  }
}

// 1quater. Fusion des doublons de **contenu** (id = base64url(sha256)) : deux
// images aux octets identiques portent le même `id` et ne peuvent donc pas
// coexister (le schéma exige des `id` uniques). Politique figée : la canonique
// est publiée, les autres sont retirées mais tracées
// (cf. `docs/analyse-id-sha256.md` §4.1).
const contentMerge = mergeContentDuplicates(allIcons);
allIcons = contentMerge.icons;
console.log(
  `🧬 Doublons de contenu : ${contentMerge.groups.length} groupe(s), ` +
    `${contentMerge.merged} icône(s) fusionnée(s) → ${allIcons.length} entrées uniques.`
);

// 1quinquies. Doublons inter-sources (P1.4) : marquer les occurrences non
// canoniques (`metadata.duplicate_of`) sans rien supprimer du catalogue.
const { groups: duplicateGroups, duplicateOf } = markDuplicates(allIcons);
for (const icon of allIcons) {
  const canonicalId = duplicateOf.get(icon.id);
  if (canonicalId) {
    icon.metadata = { ...(icon.metadata || {}), duplicate_of: canonicalId };
  }
}
console.log(
  `🔍 Doublons inter-sources : ${duplicateGroups.length} groupe(s), ` +
    `${duplicateOf.size} icône(s) marquée(s).`
);

// 2. Construire l'index Lunr
// Champs volontairement IDENTIQUES à ceux du client (`site/src/searchIndex.ts`)
// pour que l'index publié et l'index reconstruit côté navigateur donnent les
// mêmes résultats. `source`/`downloads` avaient été indexés ici mais pas côté
// client : la divergence rendait les deux recherches incohérentes.
const index = lunr(function () {
  this.ref('id');
  this.field('tags', { boost: 10 });
  this.field('artist');
  this.field('title');
  this.field('category');
  this.field('subcategory');

  allIcons.forEach(icon => {
    this.add({
      id: icon.id,
      tags: icon.tags,
      artist: icon.artist,
      title: icon.title,
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

// 5bis. Validation du schéma (P2.3) avant écriture : refuser un catalogue malformé.
const iconValidation = validateIcons(fullCatalog);
if (!iconValidation.valid) failValidation(iconValidation.errors);

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
  schemaVersion: 3,
  catalogVersion: nextCatalogVersion(previousSummary?.catalogVersion),
  updatedAt: new Date().toISOString(),
  total: allIcons.length,
  counts: {
    bySource,
    byCategory,
    byArtist,      // <-- Added: now included at top level for Authors page
    bySubcategory,
    topTags,
    topArtists
  },
  duplicates: {
    // Déduplication sémantique (titre + catégorie, non destructive).
    groups: duplicateGroups.length,
    icons: duplicateOf.size,
    // Fusion de contenu (id = hash) : icônes retirées de la publication.
    content: {
      groups: contentMerge.groups.length,
      merged: contentMerge.merged
    }
  }
};
// Validation du résumé avant écriture (schéma P2.3).
const summaryValidation = validateSummary(summary, { expectedTotal: allIcons.length });
if (!summaryValidation.valid) failValidation(summaryValidation.errors);

const summaryMeta = writeJSON(path.join(DIST_DIR, 'summary.json'), summary);

// 11. Construire le manifeste (index.json)
console.log('📝 Écriture du manifeste...');
const manifest = {
  schemaVersion: 3,
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

// Validation du manifeste avant écriture (schéma P2.3).
const manifestValidation = validateManifest(manifest, { expectedTotal: allIcons.length });
if (!manifestValidation.valid) failValidation(manifestValidation.errors);

writeJSON(path.join(DIST_DIR, 'index.json'), manifest);

// 12. Copier vers site/public pour compatibilité
console.log('📝 Synchronisation vers site/public...');
ensureDir(SITE_PUBLIC);

// P1.3 : publier le manifeste + les shards par source (l'app les charge
// progressivement et affiche dès le premier shard). `icons.json` n'est **plus
// publié** : il est remplacé par `index.json` + `icons-by-source/*` (~même
// volume, mais l'affichage n'attend plus la fin du plus gros transfert).
fs.copyFileSync(
  path.join(DIST_DIR, 'summary.json'),
  path.join(SITE_PUBLIC, 'summary.json')
);
fs.copyFileSync(
  path.join(DIST_DIR, 'index.json'),
  path.join(SITE_PUBLIC, 'index.json')
);
const siteSourceDir = path.join(SITE_PUBLIC, 'icons-by-source');
fs.rmSync(siteSourceDir, { recursive: true, force: true });
ensureDir(siteSourceDir);
for (const entry of fs.readdirSync(path.join(DIST_DIR, 'icons-by-source'))) {
  fs.copyFileSync(
    path.join(DIST_DIR, 'icons-by-source', entry),
    path.join(siteSourceDir, entry)
  );
}

// Résidus d'anciennes publications : ne pas les laisser dans `public/` (Vite
// recopie tout `public/` dans `dist/`, donc ils seraient redéployés).
fs.rmSync(path.join(SITE_PUBLIC, 'icons.json'), { force: true });
fs.rmSync(path.join(SITE_PUBLIC, 'lunr-index.bin'), { force: true });

// 12bis. Régénérer la section « Données actuelles » du README depuis le résumé
// (P0.5) : la doc versionnée suit le build, sans intervention manuelle.
updateReadmeDataSection(summary);

// 13. Générer un fichier de test HTML — **uniquement dans dist/ local**.
// Il ne doit pas être publié sur GitHub Pages (artefact de debug).
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
<h2>Endpoints API publiés (chemins relatifs à cette page)</h2>
<ul>
  <li><code>GET summary.json</code> - Statistiques</li>
  <li><code>GET index.json</code> - Manifeste (sources, compteurs)</li>
  <li><code>GET icons-by-source/{source}.json</code> - Shards par source</li>
</ul>
<p>Le dossier <code>dist/</code> local expose en plus <code>icons.json</code>
(catalogue complet), <code>search-index.json</code>, les shards par catégorie
<code>icons-by-category/{category}.json</code>, et les métadonnées individuelles
<code>icons/{id}.json</code> — mais ces fichiers <strong>ne sont pas publiés</strong>
sur GitHub Pages (seuls <code>summary.json</code>, <code>index.json</code> et
<code>icons-by-source/*.json</code> le sont).</p>
</body></html>`;

fs.writeFileSync(path.join(DIST_DIR, 'test-index.html'), testHtml);

console.log('✅ API construite avec succès !');
console.log(`   - Total icônes: ${allIcons.length}`);
console.log(`   - Dossier: ${DIST_DIR}`);
console.log(`   - Fichiers individuels: ${iconShards.length} dans dist/icons/`);
console.log(`   - Shards par source: ${sourceShards.length}`);
console.log(`   - Shards par catégorie: ${categoryShards.length}`);
console.log('   - Manifeste: dist/index.json');
console.log('   - Index recherche: dist/search-index.json');
console.log('   - Résumé: dist/summary.json');
console.log('   - Publiés (site/public): summary.json, index.json, icons-by-source/*');
console.log('   - Compatibilité site: OK');