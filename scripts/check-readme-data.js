#!/usr/bin/env node
/**
 * Garde-fou : vérifie que la section « Données actuelles » du README est
 * cohérente avec `site/public/summary.json` (P0.5, reliquat).
 *
 * À exécuter en CI après `build:api`. Sortie 1 + message d'aide si la section
 * a dérivé (édition manuelle, build sans régénération, etc.).
 *
 * Usage : `node scripts/check-readme-data.js` (ou `pnpm run check:readme`).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractDataSection, isDataSectionInSync } from './lib/readme-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const README_PATH = path.join(__dirname, '..', 'README.md');
const SUMMARY_PATH = path.join(__dirname, '..', 'site', 'public', 'summary.json');

if (!fs.existsSync(README_PATH) || !fs.existsSync(SUMMARY_PATH)) {
  console.error(`❌ Fichier manquant : ${README_PATH} ou ${SUMMARY_PATH}`);
  process.exit(2);
}

const readme = fs.readFileSync(README_PATH, 'utf8');
const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));

if (isDataSectionInSync(readme, summary)) {
  console.log('✓ README : section « Données actuelles » cohérente avec summary.json.');
  process.exit(0);
}

console.error(
  '❌ README : section « Données actuelles » désynchronisée de site/public/summary.json.'
);
console.error(
  extractDataSection(readme) === null
    ? '  - la section est absente du README'
    : '  - le contenu de la section diverge du résumé'
);
console.error('\nRégénérez-la :');
console.error('  node scripts/update-readme-data.js   (ou pnpm run update:readme)');
process.exit(1);
