#!/usr/bin/env node
/**
 * Vérifie que le repli SPA est bien présent dans la build.
 *
 * Contrat : `dist/404.html` doit exister et être **identique** à
 * `dist/index.html`. Sans ce fichier, GitHub Pages répond une vraie 404 sur les
 * routes profondes (`/categories`, `/authors`…). Un simple avertissement ne
 * suffirait pas : la régression est invisible en local (`vite preview` fait le
 * repli tout seul).
 *
 * Code retour : 0 si conforme, 1 sinon.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const indexHtml = join(distDir, 'index.html');
const fallbackHtml = join(distDir, '404.html');

if (!existsSync(indexHtml)) {
  console.error(`✖ ${indexHtml} introuvable : lancez d'abord \`pnpm run build\`.`);
  process.exit(1);
}

if (!existsSync(fallbackHtml)) {
  console.error(
    '✖ dist/404.html manquant : les routes profondes renverront une 404 sur GitHub Pages.\n' +
      '  Lancez `pnpm run postbuild` (ou une build complète).'
  );
  process.exit(1);
}

if (readFileSync(indexHtml, 'utf8') !== readFileSync(fallbackHtml, 'utf8')) {
  console.error('✖ dist/404.html diffère de dist/index.html : regénérez-le (`pnpm run postbuild`).');
  process.exit(1);
}

console.log('✓ Repli SPA présent et à jour (dist/404.html).');
