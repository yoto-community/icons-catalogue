#!/usr/bin/env node
/**
 * Régénère la section « Données actuelles » du README depuis
 * `site/public/summary.json` (P0.5, reliquat).
 *
 * Idempotent : n'écrit rien si la section est déjà à jour.
 *
 * Usage : `node scripts/update-readme-data.js` (ou `pnpm run update:readme`).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isDataSectionInSync, replaceDataSection } from './lib/readme-data.js';

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
  console.log('✓ README déjà à jour (section « Données actuelles »).');
  process.exit(0);
}

fs.writeFileSync(README_PATH, replaceDataSection(readme, summary));
console.log('✓ README mis à jour depuis site/public/summary.json.');
