#!/usr/bin/env node
/**
 * Prerender des coquilles HTML par route.
 *
 * La SPA ne sert qu'un `index.html` : toutes les routes partagent donc le même
 * `<title>` et les mêmes balises Open Graph. Les robots d'aperçu social
 * (Facebook, Twitter…) **n'exécutent pas JavaScript** : partager une catégorie
 * ou un artiste affichait un aperçu générique.
 *
 * Ce script écrit, pour chaque route découvrable, un `dist/<route>/index.html`
 * copié de `dist/index.html` avec :
 *   - `<title>`, `description`, `canonical` propres à la route ;
 *   - Open Graph + Twitter alignés ;
 *   - un bloc JSON-LD (données structurées) ;
 *   - un `<noscript>` minimale (titre + invite) pour les clients sans JS.
 *
 * GitHub Pages sert alors `dist/categories/nature/index.html` pour
 * `/icons-catalogue/categories/nature`. L'app se réhydrate normalement côté
 * client (assets en chemins absolus). Exécuté après `postbuild`.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalogueRoutes, urlFor } from './lib/catalogue-routes.mjs';

const SITE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST_DIR = join(SITE_DIR, 'dist');
const TEMPLATE_PATH = join(DIST_DIR, 'index.html');
const SUMMARY_PATH = join(DIST_DIR, 'summary.json');
const LABELS_PATH = join(SITE_DIR, 'src', 'i18n', 'locales', 'fr.json');

if (!existsSync(TEMPLATE_PATH)) {
  console.error(`✖ ${TEMPLATE_PATH} introuvable.\n  Lancez d'abord \`pnpm run build\`.`);
  process.exit(1);
}

const template = readFileSync(TEMPLATE_PATH, 'utf8');
const summary = JSON.parse(readFileSync(SUMMARY_PATH, 'utf8'));
const labels = JSON.parse(readFileSync(LABELS_PATH, 'utf8'));
const routes = buildCatalogueRoutes({ summary, categoryLabels: labels.categoryLabels });

/** Échappe une valeur destinée à un attribut HTML / texte. */
function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Remplace le contenu d'une balise `<meta>` ciblée par `attr`/`name`. */
function setMeta(html, attr, name, value) {
  const re = new RegExp(`<meta\\s+${attr}="${name}"\\s+content="[^"]*"\\s*/?>`, 'i');
  if (!re.test(html)) {
    throw new Error(`Balise <meta ${attr}="${name}"> absente du template`);
  }
  return html.replace(re, `<meta ${attr}="${name}" content="${escapeHtml(value)}" />`);
}

/** Sérialise en JSON-LD sûr dans un contexte HTML (`</script>` neutralisé). */
function serializeJsonLd(jsonLd) {
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}

function renderShell(route) {
  const url = urlFor(route.path);
  const title = `${route.title} — Yoto Icons Catalogue`;

  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = setMeta(html, 'name', 'description', route.description);
  html = setMeta(html, 'property', 'og:title', title);
  html = setMeta(html, 'property', 'og:description', route.description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'name', 'twitter:title', title);
  html = setMeta(html, 'name', 'twitter:description', route.description);
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapeHtml(url)}" />`
  );

  // Données structurées.
  html = html.replace(
    '</head>',
    `    <script type="application/ld+json">${serializeJsonLd(route.jsonLd)}</script>\n  </head>`
  );

  // Repli sans JavaScript (crawlers simples, lecteurs d'écran en mode texte).
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"></div>\n    <noscript><h1>${escapeHtml(route.title)}</h1><p>${escapeHtml(
      route.description
    )}</p><p><a href="${urlFor('')}">Catalogue complet</a></p></noscript>`
  );

  return html;
}

let written = 0;
for (const route of routes) {
  const dir = join(DIST_DIR, route.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), renderShell(route), 'utf8');
  written += 1;
}

console.log(`✓ Prerender : ${written} coquille(s) HTML par route écrites dans dist/.`);
