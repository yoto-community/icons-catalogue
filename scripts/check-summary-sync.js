#!/usr/bin/env node
/**
 * Vérifie que `site/public/summary.json` (versionné) est cohérent avec `data/`
 * (P2.6).
 *
 * Usage : `node scripts/check-summary-sync.js <summary-versionné> <summary-régénéré>`
 *
 * À exécuter en CI : on photographie le résumé versionné **avant** `build:api`,
 * puis on le compare au résumé régénéré. Un écart indique que `data/` a changé
 * sans régénération de `summary.json` (compteurs publiés obsolètes).
 */

import fs from 'fs';
import { compareSummaryCounts } from './lib/summary-sync.js';

const [beforePath, afterPath] = process.argv.slice(2);

if (!beforePath || !afterPath) {
  console.error(
    'Usage : node scripts/check-summary-sync.js <summary-versionné> <summary-régénéré>'
  );
  process.exit(2);
}

if (!fs.existsSync(beforePath)) {
  console.warn(`⚠️ ${beforePath} absent : comparaison ignorée (premier build ?).`);
  process.exit(0);
}

const previous = JSON.parse(fs.readFileSync(beforePath, 'utf8'));
const current = JSON.parse(fs.readFileSync(afterPath, 'utf8'));

const { inSync, differences } = compareSummaryCounts(previous, current);

if (!inSync) {
  console.error('❌ summary.json versionné désynchronisé de data/ :');
  for (const difference of differences) console.error(`  - ${difference}`);
  console.error('\nRégénérez le catalogue et committez site/public/summary.json :');
  console.error('  pnpm run build:api');
  process.exit(1);
}

console.log('✓ summary.json cohérent avec data/ (compteurs identiques).');
