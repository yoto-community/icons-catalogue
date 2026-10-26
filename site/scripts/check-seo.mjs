#!/usr/bin/env node
/**
 * Vérifie les métadonnées de partage/SEO **et** les artefacts SEO générés :
 *
 * - balises Open Graph + Twitter Card + `canonical` dans `index.html` ;
 * - `description` mentionnant les **trois** sources ;
 * - `public/robots.txt` présent et cohérent avec l'URL de base publiée ;
 * - `dist/sitemap.xml` **généré** (`generate:sitemap`) : liste les catégories
 *   et les artistes, pas seulement les 5 routes statiques ;
 * - **prerender** (`prerender`): une coquille HTML par route avec `title`,
 *   `canonical`, `og:url` et JSON-LD propres (les crawlers sociaux n'exécutent
 *   pas JavaScript).
 *
 * Nécessite `pnpm run build` (les vérifications dist/ supposent la build).
 * Aucune dépendance externe. Sort en erreur si un contrôle échoue.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_PATH = join(ROOT, 'index.html');
const ROBOTS_PATH = join(ROOT, 'public', 'robots.txt');
const DIST_DIR = join(ROOT, 'dist');
const SITEMAP_PATH = join(DIST_DIR, 'sitemap.xml');

/** URL de base publiée (GitHub Pages du dépôt yoto-community/icons-catalogue). */
const BASE_URL = 'https://yoto-community.github.io/icons-catalogue';

const errors = [];

if (!existsSync(INDEX_PATH)) {
  console.error('❌ site/index.html introuvable.');
  process.exit(1);
}
const html = readFileSync(INDEX_PATH, 'utf8');

/** Balises attendues dans le <head>. */
const REQUIRED_META = [
  'rel="canonical"',
  'property="og:type"',
  'property="og:title"',
  'property="og:description"',
  'property="og:url"',
  'property="og:image"',
  'name="twitter:card"',
  'name="twitter:title"',
  'name="twitter:description"',
  'name="twitter:image"',
];
for (const tag of REQUIRED_META) {
  if (!html.includes(tag)) errors.push(`index.html : balise manquante « ${tag} »`);
}

// La description doit citer les trois sources.
const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1] ?? '';
for (const source of ['yotopixels', 'yotoicons', 'yoto']) {
  if (!description.toLowerCase().includes(source)) {
    errors.push(`index.html : la description ne mentionne pas « ${source} »`);
  }
}

// robots.txt
if (!existsSync(ROBOTS_PATH)) {
  errors.push('public/robots.txt manquant');
} else {
  const robots = readFileSync(ROBOTS_PATH, 'utf8');
  if (!robots.includes('Sitemap:')) errors.push('robots.txt : pas de directive « Sitemap: »');
  if (!robots.includes(BASE_URL)) errors.push('robots.txt : URL de base absente');
}

// ---- Artefacts générés (dist/) -------------------------------------------
const distIndexPath = join(DIST_DIR, 'index.html');
if (!existsSync(distIndexPath)) {
  errors.push("dist/index.html manquant : lancez d'abord `pnpm run build`");
}

// sitemap généré
if (!existsSync(SITEMAP_PATH)) {
  errors.push('dist/sitemap.xml manquant : lancez `pnpm run generate:sitemap` (inclus dans build)');
} else {
  const sitemap = readFileSync(SITEMAP_PATH, 'utf8');
  if (!sitemap.trimStart().startsWith('<?xml')) errors.push('sitemap.xml : en-tête XML absent');
  if (!sitemap.includes('<urlset') || !sitemap.includes('</urlset>')) {
    errors.push('sitemap.xml : élément <urlset> absent');
  }
  if (!sitemap.includes(`${BASE_URL}/`)) errors.push('sitemap.xml : URL de base absente');
  if (!sitemap.includes(`${BASE_URL}/categories/`)) {
    errors.push('sitemap.xml : les pages de catégorie sont absentes');
  }
  if (!sitemap.includes(`${BASE_URL}/authors/`)) {
    errors.push('sitemap.xml : les pages d’artiste sont absentes');
  }
  const locCount = (sitemap.match(/<loc>/g) ?? []).length;
  if (locCount < 10) {
    errors.push(
      `sitemap.xml : seulement ${locCount} URL (attendu : routes + catégories + artistes)`
    );
  }
}

// prerender par route
function readRoute(relative) {
  const path = join(DIST_DIR, relative, 'index.html');
  if (!existsSync(path)) {
    errors.push(`prerender manquant : dist/${relative}/index.html`);
    return null;
  }
  return readFileSync(path, 'utf8');
}

const staticRoutes = ['categories', 'authors', 'sources', 'developers'];
for (const route of staticRoutes) {
  const routeHtml = readRoute(route);
  if (routeHtml && !routeHtml.includes('application/ld+json')) {
    errors.push(`prerender : dist/${route}/index.html sans JSON-LD`);
  }
}

// Contrôle représentatif d'une route paramétrée : la title/OG/canonical
// doivent être spécifiques (et non le générique de l'accueil).
const category = readRoute('categories/nature');
if (category) {
  if (!/<title>[^<]*Nature[^<]*<\/title>/i.test(category)) {
    errors.push('prerender : la page catégorie « nature » n’a pas un titre spécifique');
  }
  if (!category.includes(`rel="canonical" href="${BASE_URL}/categories/nature"`)) {
    errors.push('prerender : canonical de la page catégorie « nature » incorrect');
  }
  if (!category.includes(`content="${BASE_URL}/categories/nature"`)) {
    errors.push('prerender : og:url de la page catégorie « nature » incorrect');
  }
  if (!category.includes('<noscript>')) {
    errors.push('prerender : la page catégorie « nature » n’a pas de repli <noscript>');
  }
}

// Au moins une page d'artiste doit être générée.
const authorsDir = join(DIST_DIR, 'authors');
if (existsSync(authorsDir)) {
  const authorPages = readdirSync(authorsDir, { withFileTypes: true }).filter((e) =>
    e.isDirectory()
  );
  if (authorPages.length === 0) errors.push('prerender : aucune page d’artiste générée');
} else {
  errors.push('prerender : dist/authors/ absent');
}

if (errors.length > 0) {
  console.error('SEO / partage : problèmes détectés\n');
  for (const error of errors) console.error(`  - ${error}`);
  console.error(`\n${errors.length} problème(s).`);
  process.exit(1);
}

console.log(
  '✓ SEO / partage : Open Graph/Twitter, robots.txt, sitemap généré et prerender par route conformes.'
);
