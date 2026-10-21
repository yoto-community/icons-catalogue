#!/usr/bin/env node
/**
 * Vérifie la cohérence des traductions embarquées (`src/i18n/locales/*.json`),
 * source unique de vérité depuis la suppression du fetch de `public/locales`.
 *
 * Contrôles :
 *  1. `fr` et `en` exposent exactement les mêmes clés ;
 *  2. aucune valeur de traduction vide ;
 *  3. toute clé statique `t('…')` / `tRich('…')` utilisée dans `src/`
 *     existe dans les deux locales.
 *
 * Sort en erreur (exit 1) avec un rapport lisible. Aucune dépendance externe.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_DIR = join(ROOT, 'src', 'i18n', 'locales');

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, full, out);
    } else {
      out[full] = value;
    }
  }
  return out;
}

function collectSourceFiles(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

const fr = flatten(JSON.parse(readFileSync(join(LOCALES_DIR, 'fr.json'), 'utf8')));
const en = flatten(JSON.parse(readFileSync(join(LOCALES_DIR, 'en.json'), 'utf8')));

const errors = [];

// 1. Parité des clés
const frKeys = Object.keys(fr).sort();
const enKeys = Object.keys(en).sort();
for (const key of frKeys) {
  if (!(key in en)) errors.push(`clé absente de en.json : ${key}`);
}
for (const key of enKeys) {
  if (!(key in fr)) errors.push(`clé absente de fr.json : ${key}`);
}

// 2. Valeurs non vides
for (const [locale, strings] of [
  ['fr', fr],
  ['en', en],
]) {
  for (const [key, value] of Object.entries(strings)) {
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`valeur vide dans ${locale}.json : ${key}`);
    }
  }
}

// 3. Clés utilisées statiquement
const usedKeys = new Set();
const CALL_RE = /\bt(?:Rich)?\(\s*'([^']+)'/g;
for (const file of collectSourceFiles(join(ROOT, 'src'))) {
  const content = readFileSync(file, 'utf8');
  let match;
  while ((match = CALL_RE.exec(content)) !== null) {
    usedKeys.add(match[1]);
  }
}

// Garde-fou : si l'extraction ne trouve presque rien, la détection est cassée.
if (usedKeys.size < 50) {
  errors.push(
    `extraction suspecte : seulement ${usedKeys.size} clés trouvées dans src/ ` +
      '(la syntaxe des appels t()/tRich() a-t-elle changé ?)'
  );
}

for (const key of [...usedKeys].sort()) {
  if (!(key in fr)) errors.push(`clé utilisée mais absente de fr.json : ${key}`);
  if (!(key in en)) errors.push(`clé utilisée mais absente de en.json : ${key}`);
}

if (errors.length > 0) {
  console.error('i18n : incohérences détectées\n');
  for (const error of errors) console.error(`  - ${error}`);
  console.error(`\n${errors.length} problème(s).`);
  process.exit(1);
}

console.log(
  `i18n OK : ${frKeys.length} clés alignées fr/en, ${usedKeys.size} clés utilisées vérifiées.`
);
