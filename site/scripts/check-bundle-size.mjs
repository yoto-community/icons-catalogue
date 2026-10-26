#!/usr/bin/env node
/**
 * Contrôle la taille des bundles produits par `vite build` contre des budgets.
 *
 * Objectif : détecter les régressions de poids **avant** qu'elles n'atteignent
 * la production. Un import oublié (bibliothèque lourde, duplication) explose
 * souvent le bundle sans casser aucun test.
 *
 * Usage : node scripts/check-bundle-size.mjs  (après `vite build`)
 * Code retour : 0 si tout est dans les budgets, 1 sinon.
 */
import { readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const distDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'assets');

/**
 * Budgets en octets (gzip). Le poids est mesuré après compression car c'est
 * ce que le navigateur télécharge réellement.
 *
 * Relevés pour React 19 : son `react-dom` client est sensiblement plus gros
 * que celui de React 18 (≈ +23 Ko gzip sur le chunk `index`).
 */
const BUDGETS = {
  total: 150 * 1024, // Budget global des JS+CSS compressés
  perFile: 115 * 1024, // Aucun fichier compressé ne doit dépasser 115 Ko
};

function formatKo(bytes) {
  return `${(bytes / 1024).toFixed(1)} Ko`;
}

let files;
try {
  files = readdirSync(distDir).filter(f => /\.(js|css)$/.test(f));
} catch {
  console.error(`✖ Dossier introuvable : ${distDir}\n  Lancez d'abord \`vite build\`.`);
  process.exit(1);
}

const sizes = files.map(file => {
  const raw = readFileSync(join(distDir, file));
  return { file, gzipped: gzipSync(raw, { level: 9 }).length };
});

sizes.sort((a, b) => b.gzipped - a.gzipped);

console.log('Tailles des bundles (gzip) :');
for (const { file, gzipped } of sizes) {
  const over = gzipped > BUDGETS.perFile;
  console.log(`  ${over ? '✖' : '✓'} ${file.padEnd(45)} ${formatKo(gzipped)}`);
}

const total = sizes.reduce((sum, s) => sum + s.gzipped, 0);
console.log(`\n  Total : ${formatKo(total)} (budget ${formatKo(BUDGETS.total)})`);

const violations = [];
if (total > BUDGETS.total) {
  violations.push(`Budget total dépassé : ${formatKo(total)} > ${formatKo(BUDGETS.total)}`);
}
for (const { file, gzipped } of sizes) {
  if (gzipped > BUDGETS.perFile) {
    violations.push(`${file} : ${formatKo(gzipped)} > ${formatKo(BUDGETS.perFile)} par fichier`);
  }
}

if (violations.length > 0) {
  console.error('\n✖ Budget(s) de bundle dépassé(s) :');
  for (const v of violations) console.error(`    - ${v}`);
  console.error('\n  Si la hausse est voulue, augmentez le budget dans ce script.');
  process.exit(1);
}

console.log('\n✓ Tous les budgets de bundle sont respectés.');
