#!/usr/bin/env node
/**
 * Vérifie les métadonnées de partage/SEO (P3.3) :
 * - balises Open Graph + Twitter Card + canonical dans `index.html` ;
 * - `description` mentionnant les **trois** sources ;
 * - `public/robots.txt` et `public/sitemap.xml` présents et cohérents avec
 *   l'URL de base publiée.
 *
 * Aucune dépendance externe. Sort en erreur si une métadonnée manque.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX_PATH = join(ROOT, 'index.html');
const ROBOTS_PATH = join(ROOT, 'public', 'robots.txt');
const SITEMAP_PATH = join(ROOT, 'public', 'sitemap.xml');

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

// sitemap.xml
if (!existsSync(SITEMAP_PATH)) {
  errors.push('public/sitemap.xml manquant');
} else {
  const sitemap = readFileSync(SITEMAP_PATH, 'utf8');
  if (!sitemap.trimStart().startsWith('<?xml')) errors.push('sitemap.xml : en-tête XML absent');
  if (!sitemap.includes('<urlset') || !sitemap.includes('</urlset>')) {
    errors.push('sitemap.xml : élément <urlset> absent');
  }
  if (!sitemap.includes(`${BASE_URL}/`)) errors.push('sitemap.xml : URL de base absente');
}

if (errors.length > 0) {
  console.error('SEO / partage : problèmes détectés\n');
  for (const error of errors) console.error(`  - ${error}`);
  console.error(`\n${errors.length} problème(s).`);
  process.exit(1);
}

console.log('✓ SEO / partage : métadonnées Open Graph/Twitter, robots.txt et sitemap.xml présents.');
