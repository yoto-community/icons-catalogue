#!/usr/bin/env node
/**
 * Mesure reproductible du coût de l'index de recherche Lunr.
 *
 * Objectif (P8) : chiffrer, sur le catalogue RÉEL, ce que coûte la stratégie
 * actuelle — reconstruction de l'index côté client à chaque visite — et le
 * comparatif « index préconstruit sérialisé » (le `dist/search-index.json`
 * produit localement par `build:api`), avant d'envisager un changement de
 * moteur ou la publication d'un index précalculé.
 *
 * Reproduit fidèlement `src/searchIndex.ts` : mêmes champs/boosts
 * (`SEARCH_FIELDS`) et même pipeline d'accents (`stripDiacritics` inséré avant
 * le `stemmer`, dans les pipelines documents ET requêtes).
 *
 * Données (par ordre de préférence) :
 *   - `../../dist/icons.json`               (catalogue complet, racine, local)
 *   - `../public/icons-by-source/*.json`     (shards par source)
 *
 * Usage : pnpm run measure:search   (depuis site/)
 *         node scripts/measure-search-index.mjs --json   (sortie machine)
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import lunr from 'lunr';

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_DIR = join(SITE_DIR, '..');

/** Copie fidèle de `SEARCH_FIELDS` (src/searchIndex.ts). */
const SEARCH_FIELDS = [
  { name: 'tags', boost: 10 },
  { name: 'artist' },
  { name: 'title' },
  { name: 'category' },
  { name: 'subcategory' },
];

const STRIP_DIACRITICS_LABEL = 'stripDiacritics';

function stripDiacritics(token) {
  return token.update((value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, ''));
}

// Un seul module : enregistrer inconditionnellement provoquerait un warning.
lunr.Pipeline.registerFunction(stripDiacritics, STRIP_DIACRITICS_LABEL);

/** Charge le catalogue réel depuis les artefacts locaux. */
function loadIcons() {
  const full = join(REPO_DIR, 'dist', 'icons.json');
  if (existsSync(full)) {
    return { icons: JSON.parse(readFileSync(full, 'utf8')), source: 'dist/icons.json' };
  }

  const shardsDir = join(SITE_DIR, 'public', 'icons-by-source');
  if (existsSync(shardsDir)) {
    const files = readdirSync(shardsDir).filter((name) => name.endsWith('.json'));
    if (files.length > 0) {
      const icons = files.flatMap((name) =>
        JSON.parse(readFileSync(join(shardsDir, name), 'utf8'))
      );
      return { icons, source: `public/icons-by-source/*.json (${files.length})` };
    }
  }

  return null;
}

/** Construit l'index comme `buildSearchIndex` (mesuré). */
function buildIndex(icons) {
  return lunr(function () {
    this.ref('id');
    for (const field of SEARCH_FIELDS) this.field(field.name, { boost: field.boost });

    // Accents ignorés (index + requêtes), cf. src/searchIndex.ts.
    // AVANT le `trimmer` : celui-ci supprime les caractères non-ASCII en fin de
    // mot (« café » → « caf »).
    this.pipeline.before(lunr.trimmer, stripDiacritics);
    this.searchPipeline.before(lunr.stemmer, stripDiacritics);

    for (const icon of icons) {
      this.add({
        id: icon.id,
        tags: icon.tags,
        artist: icon.artist,
        title: icon.title,
        category: icon.category,
        subcategory: icon.subcategory,
      });
    }
  });
}

function mb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function timed(fn) {
  const start = process.hrtime.bigint();
  const value = fn();
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  return { value, ms };
}

const loaded = loadIcons();
if (!loaded) {
  console.error(
    '✖ Aucune donnée trouvée.\n' +
      '  Générez d’abord le catalogue : `pnpm run build:api` (racine), puis relancez.'
  );
  process.exit(1);
}

const { icons, source } = loaded;
const report = { source, iconCount: icons.length };

// 1. Reconstruction (stratégie actuelle : à chaque visite, dans le worker).
const build = timed(() => buildIndex(icons));
report.buildMs = Math.round(build.ms);

// 2. Sérialisation + poids d'un index préconstruit.
const serialized = JSON.stringify(build.value);
report.serializedWithFieldsBytes = Buffer.byteLength(serialized);
report.serializedGzipBytes = gzipSync(serialized, { level: 9 }).length;
const load = timed(() => lunr.Index.load(JSON.parse(serialized)));
report.serializedLoadMs = Math.round(load.ms);

// Contrôle de non-régression : l'index rechargé doit répondre.
const probe = load.value.search('moon');
report.probeHits = probe.length;

// 3. Index réellement produit par build:api (dist/search-index.json), s'il existe.
const prebuiltPath = join(REPO_DIR, 'dist', 'search-index.json');
if (existsSync(prebuiltPath)) {
  const raw = readFileSync(prebuiltPath, 'utf8');
  report.prebuiltPath = 'dist/search-index.json';
  report.prebuiltBytes = Buffer.byteLength(raw);
  report.prebuiltGzipBytes = gzipSync(raw, { level: 9 }).length;
  const prebuiltLoad = timed(() => lunr.Index.load(JSON.parse(raw)));
  report.prebuiltLoadMs = Math.round(prebuiltLoad.ms);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

console.log('Mesure de l’index de recherche Lunr (catalogue réel)\n');
console.log(`  Données                : ${source}`);
console.log(`  Icônes indexées        : ${report.iconCount}`);
console.log();
console.log(
  `  Reconstruction         : ${report.buildMs} ms   (stratégie actuelle, à chaque visite)`
);
console.log(
  `  Index sérialisé        : ${mb(report.serializedWithFieldsBytes)} (${mb(report.serializedGzipBytes)} gzip) — rechargement ${report.serializedLoadMs} ms`
);
console.log(`  Sonde « moon »         : ${report.probeHits} résultat(s)`);
if (report.prebuiltBytes !== undefined) {
  console.log(
    `  dist/search-index.json : ${mb(report.prebuiltBytes)} (${mb(report.prebuiltGzipBytes)} gzip) — rechargement ${report.prebuiltLoadMs} ms`
  );
}
console.log();
console.log(
  'À retenir : comparer le temps de reconstruction (CPU, dans le worker) au\n' +
    'poids réseau du préconstruit. Le préconstruit n’est pertinent que pour un\n' +
    'catalogue servi en une fois (hors découpage en shards).'
);
