#!/usr/bin/env node
/**
 * Vérifie que la PWA **ne précache pas les données** du catalogue (P1.3).
 *
 * `icons.json` (~19 Mo) et `summary.json` étaient précachés par Workbox : chaque
 * installation du service worker téléchargeait tout le catalogue. Ils sont
 * désormais servis par une règle de cache *runtime* (`catalogue-data`) : mis en
 * cache à la première visite pour un fonctionnement hors-ligne ultérieur, sans
 * alourdir l'installation.
 *
 * Sort en erreur si une donnée redevient précachée ou si la règle runtime
 * disparaît. Aucune dépendance externe.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SW_PATH = join(ROOT, 'dist', 'sw.js');

/** Données volumineuses qui ne doivent PAS être précachées. */
const FORBIDDEN = ['icons.json', 'summary.json', 'index.json', 'lunr-index.bin'];
/** Ressources applicatives qui DOIVENT rester précachées. */
const REQUIRED = ['index.html', 'manifest.webmanifest', 'registerSW.js'];
/** Cache runtime attendu pour les données (offline après la 1re visite). */
const RUNTIME_CACHE = 'catalogue-data';

if (!existsSync(SW_PATH)) {
  console.error("❌ dist/sw.js introuvable — lancez d'abord `pnpm run build`.");
  process.exit(1);
}

const sw = readFileSync(SW_PATH, 'utf8');
const isPrecached = (name) => sw.includes(`url:"${name}"`) || sw.includes(`url: '${name}'`);

const errors = [];
for (const name of FORBIDDEN) {
  if (isPrecached(name)) {
    errors.push(`« ${name} » est précaché (installation PWA inutilement lourde)`);
  }
}
if (sw.includes('icons-by-source')) {
  errors.push('les shards (icons-by-source/) ne doivent pas être précachés');
}
for (const name of REQUIRED) {
  if (!isPrecached(name)) {
    errors.push(`« ${name} » devrait rester précaché`);
  }
}
if (!sw.includes(RUNTIME_CACHE)) {
  errors.push(`règle de cache runtime « ${RUNTIME_CACHE} » absente (plus d'offline après 1re visite)`);
}

if (errors.length > 0) {
  console.error('Précache PWA : problèmes détectés\n');
  for (const error of errors) console.error(`  - ${error}`);
  console.error(`\n${errors.length} problème(s).`);
  process.exit(1);
}

console.log('✓ Précache PWA léger : données servies par cache runtime, pas précachées.');
