#!/usr/bin/env node
/**
 * Génère `dist/sitemap.xml` à partir du catalogue réel (`dist/summary.json`).
 *
 * Le sitemap était auparavant statique (5 URL) et ne référençait ni les
 * catégories ni les artistes. Il est désormais dérivé du résumé de build —
 * donc toujours en phase avec les données — et couvre :
 *   - `/`, `/categories`, `/authors`, `/sources`, `/developers` ;
 *   - chaque page de catégorie (`/categories/:cat`) ;
 *   - chaque page d'artiste (`/authors/:artist`).
 *
 * Exécuté après `copy-data` (le résumé est dans `dist/`), voir `pnpm run build`.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASE_URL, buildCatalogueRoutes, urlFor } from './lib/catalogue-routes.mjs';

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = join(SITE_DIR, 'dist');
const SUMMARY_PATH = join(DIST_DIR, 'summary.json');
const LABELS_PATH = join(SITE_DIR, 'src', 'i18n', 'locales', 'fr.json');

if (!existsSync(SUMMARY_PATH)) {
  console.error(
    `✖ ${SUMMARY_PATH} introuvable.\n  Lancez d'abord \`pnpm run build\` (ou \`pnpm run copy-data\`).`
  );
  process.exit(1);
}

const summary = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'));
const labels = JSON.parse(readFileSync(LABELS_PATH, 'utf8'));
const routes = buildCatalogueRoutes({ summary, categoryLabels: labels.categoryLabels });

/** Échappe une valeur pour un contenu XML. */
function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const lastmod = typeof summary.updatedAt === 'string' ? summary.updatedAt.slice(0, 10) : undefined;

const entries = [
  { loc: `${BASE_URL}/`, changefreq: 'weekly', priority: '1.0' },
  ...routes.map((route) => ({
    loc: urlFor(route.path),
    changefreq: route.changefreq,
    priority: route.priority,
  })),
];

const urls = entries
  .map((entry) => {
    const parts = [`    <loc>${escapeXml(entry.loc)}</loc>`];
    if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
    parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    parts.push(`    <priority>${entry.priority}</priority>`);
    return `  <url>\n${parts.join('\n')}\n  </url>`;
  })
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

writeFileSync(join(DIST_DIR, 'sitemap.xml'), xml, 'utf8');
console.log(`✓ Sitemap généré : dist/sitemap.xml (${entries.length} URL).`);
