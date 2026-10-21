#!/usr/bin/env node
/**
 * Vérifie que les données générées du catalogue sont présentes avant le build
 * du site (P1.5).
 *
 * `public/summary.json`, `public/index.json` et `public/icons-by-source/*` ne
 * sont plus versionnés (ils faisaient croître l'historique Git à chaque mise à
 * jour). Ils sont produits par `pnpm run build:api` à la racine. Sans ce
 * contrôle, le build échouerait plus loin avec un message obscur
 * (`cp: cannot stat …`).
 */

import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED = ['public/summary.json', 'public/index.json'];

const missing = REQUIRED.filter((file) => !existsSync(join(ROOT, file)));

if (missing.length > 0) {
  console.error('❌ Données du catalogue manquantes :');
  for (const file of missing) console.error(`  - site/${file}`);
  console.error('\nCes fichiers ne sont plus versionnés (P1.5). Générez-les d’abord :');
  console.error('  cd .. && pnpm install && pnpm run build:api');
  process.exit(1);
}

// P1.3 : les shards par source sont l'entrée principale du front.
const shardDir = join(ROOT, 'public', 'icons-by-source');
if (!existsSync(shardDir) || readdirSync(shardDir).length === 0) {
  console.error('❌ Aucun shard dans site/public/icons-by-source/ (P1.3).');
  console.error('  cd .. && pnpm run build:api');
  process.exit(1);
}

console.log('✓ Données du catalogue présentes.');
