#!/usr/bin/env node
/**
 * Repli SPA pour GitHub Pages.
 *
 * GitHub Pages n'applique **aucun rewrite** : toute URL sans fichier
 * correspondant renvoie `404.html`. En publiant une copie de `index.html` sous
 * ce nom, les routes profondes (`/categories`, `/authors`, `/favorites`,
 * `/developers`) se chargent correctement même en accès direct ou après un
 * rechargement — sans quoi elles renverraient une vraie 404.
 *
 * Exécuté en fin de `pnpm run build` (voir `postbuild`).
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const indexHtml = join(distDir, 'index.html');

if (!existsSync(indexHtml)) {
  console.error(`✖ ${indexHtml} introuvable : lancez d'abord \`vite build\`.`);
  process.exit(1);
}

copyFileSync(indexHtml, join(distDir, '404.html'));
console.log('✓ Repli SPA généré : dist/404.html');
