/**
 * Validation de schéma des artefacts du catalogue (P2.3).
 *
 * Rôle : refuser, **avant publication**, un `icons.json` / `summary.json` /
 * `index.json` malformé (champ requis manquant, type inattendu, valeur hors
 * taxonomie, licence incohérente, identifiant dupliqué). Aucun réseau, aucune
 * dépendance externe : logique pure et testée (`catalogue-schema.test.js`).
 *
 * Les énumérations proviennent des **sources uniques** du projet :
 * `taxonomy.js` (catégories/sous-catégories) et `source-licenses.js`
 * (sources et licences). Le validateur ne redéfinit donc jamais une valeur.
 */

import { CATEGORIES, SUBCATEGORIES } from './taxonomy.js';
import { SOURCE_LICENSES } from './source-licenses.js';

/** Sources canoniques (clés de `SOURCE_LICENSES`). */
export const SOURCES = Object.freeze(Object.keys(SOURCE_LICENSES));

/** Licences canoniques (valeurs de `SOURCE_LICENSES`). */
export const LICENSES = Object.freeze([...new Set(Object.values(SOURCE_LICENSES))]);

/** Version du schéma publié (alignée sur `build-api.js`). */
export const SCHEMA_VERSION = 2;

/** Champs texte obligatoires et non vides d'une icône. */
const ICON_STRING_FIELDS = [
  'id',
  'source',
  'title',
  'artist',
  'preview_image',
  'download_url',
  'category',
  'subcategory',
  'license',
  'date_added',
];

/** Champs d'icône devant être des URL `http(s)`. */
const ICON_URL_FIELDS = ['preview_image', 'download_url'];

const SHA256_RE = /^[0-9a-f]{64}$/i;

/** Objet simple (ni `null`, ni tableau, ni primitive). */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Vrai si la valeur est une chaîne non vide (espaces exclus). */
function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/** Vrai si la valeur est une date analysable par `Date.parse`. */
function isDateString(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

/**
 * Valide une icône unique. Ne jette pas : renvoie la liste des erreurs
 * (vide si l'icône est conforme).
 *
 * @param {unknown} icon
 * @returns {string[]}
 */
export function validateIcon(icon) {
  if (!isPlainObject(icon)) return ['icône : objet attendu'];

  const errors = [];

  for (const field of ICON_STRING_FIELDS) {
    if (!isNonEmptyString(icon[field])) {
      errors.push(`champ \`${field}\` requis (chaîne non vide)`);
    }
  }

  if (isNonEmptyString(icon.source) && !SOURCES.includes(icon.source)) {
    errors.push(`\`source\` inconnue : « ${icon.source} »`);
  }

  if (isNonEmptyString(icon.category) && !CATEGORIES.includes(icon.category)) {
    errors.push(`\`category\` hors taxonomie : « ${icon.category} »`);
  }

  if (isNonEmptyString(icon.subcategory) && !SUBCATEGORIES.includes(icon.subcategory)) {
    errors.push(`\`subcategory\` hors taxonomie : « ${icon.subcategory} »`);
  }

  if (isNonEmptyString(icon.license)) {
    if (!LICENSES.includes(icon.license)) {
      errors.push(`\`license\` inconnue : « ${icon.license} »`);
    } else if (SOURCES.includes(icon.source) && SOURCE_LICENSES[icon.source] !== icon.license) {
      errors.push(
        `\`licence\` incohérente : « ${icon.license} » pour la source « ${icon.source} » ` +
          `(attendu « ${SOURCE_LICENSES[icon.source]} »)`
      );
    }
  }

  if (!Array.isArray(icon.tags) || icon.tags.some((tag) => typeof tag !== 'string')) {
    errors.push('champ `tags` requis (tableau de chaînes)');
  }

  if (
    typeof icon.downloads !== 'number' ||
    !Number.isFinite(icon.downloads) ||
    icon.downloads < 0
  ) {
    errors.push('champ `downloads` requis (nombre ≥ 0)');
  }

  if (isNonEmptyString(icon.date_added) && !isDateString(icon.date_added)) {
    errors.push('champ `date_added` : date invalide');
  }

  for (const field of ICON_URL_FIELDS) {
    if (isNonEmptyString(icon[field]) && !/^https?:\/\//.test(icon[field])) {
      errors.push(`champ \`${field}\` : URL http(s) attendue`);
    }
  }

  if (icon.metadata !== undefined && !isPlainObject(icon.metadata)) {
    errors.push('champ `metadata` : objet attendu');
  }

  return errors;
}

/**
 * Valide un catalogue complet : chaque icône + unicité des identifiants.
 *
 * @param {unknown} icons
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateIcons(icons) {
  if (!Array.isArray(icons)) {
    return { valid: false, errors: ['le catalogue doit être un tableau'] };
  }

  const errors = [];
  if (icons.length === 0) errors.push('le catalogue est vide');

  const seen = new Map();
  icons.forEach((icon, index) => {
    const label = isNonEmptyString(icon?.id) ? icon.id : `#${index}`;
    for (const error of validateIcon(icon)) {
      errors.push(`icône ${label} : ${error}`);
    }
    if (isNonEmptyString(icon?.id)) {
      if (seen.has(icon.id)) {
        errors.push(`id dupliqué : « ${icon.id} » (index ${seen.get(icon.id)} et ${index})`);
      } else {
        seen.set(icon.id, index);
      }
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Valide le résumé (`summary.json`).
 *
 * @param {unknown} summary
 * @param {{expectedTotal?: number}} [options]
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateSummary(summary, { expectedTotal } = {}) {
  if (!isPlainObject(summary)) {
    return { valid: false, errors: ['résumé : objet attendu'] };
  }

  const errors = [];

  if (summary.schemaVersion !== SCHEMA_VERSION) {
    errors.push(
      `\`schemaVersion\` attendu ${SCHEMA_VERSION}, reçu ${JSON.stringify(summary.schemaVersion)}`
    );
  }
  if (!isNonEmptyString(summary.catalogVersion)) {
    errors.push('champ `catalogVersion` requis (chaîne non vide)');
  }
  if (!isDateString(summary.updatedAt)) {
    errors.push('champ `updatedAt` : date invalide');
  }
  if (!Number.isInteger(summary.total) || summary.total < 0) {
    errors.push('champ `total` requis (entier ≥ 0)');
  } else if (typeof expectedTotal === 'number' && summary.total !== expectedTotal) {
    errors.push(`\`total\` ${summary.total} ≠ nombre d’icônes ${expectedTotal}`);
  }

  if (!isPlainObject(summary.counts)) {
    errors.push('champ `counts` requis (objet)');
  } else {
    if (!isPlainObject(summary.counts.bySource)) {
      errors.push('`counts.bySource` requis (objet)');
    } else {
      for (const source of SOURCES) {
        if (typeof summary.counts.bySource[source] !== 'number') {
          errors.push(`\`counts.bySource.${source}\` requis (nombre)`);
        }
      }
      const sum = Object.values(summary.counts.bySource).reduce(
        (acc, value) => acc + (typeof value === 'number' ? value : 0),
        0
      );
      if (Number.isInteger(summary.total) && sum !== summary.total) {
        errors.push(`\`counts.bySource\` : somme ${sum} ≠ total ${summary.total}`);
      }
    }
    if (!isPlainObject(summary.counts.byCategory)) {
      errors.push('`counts.byCategory` requis (objet)');
    }
  }

  if (!isPlainObject(summary.duplicates)) {
    errors.push('champ `duplicates` requis (objet)');
  } else {
    if (!Number.isInteger(summary.duplicates.groups)) {
      errors.push('`duplicates.groups` requis (entier)');
    }
    if (!Number.isInteger(summary.duplicates.icons)) {
      errors.push('`duplicates.icons` requis (entier)');
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Valide une référence de fichier shard : `{paths, bytes, sha256}`. */
function validateFileRef(ref, label, errors) {
  if (!isPlainObject(ref)) {
    errors.push(`\`${label}\` requis (objet)`);
    return;
  }
  if (!isNonEmptyString(ref.path)) {
    errors.push(`\`${label}.path\` requis (chaîne non vide)`);
  }
  if (!Number.isInteger(ref.bytes) || ref.bytes < 0) {
    errors.push(`\`${label}.bytes\` requis (entier ≥ 0)`);
  }
  if (typeof ref.sha256 !== 'string' || !SHA256_RE.test(ref.sha256)) {
    errors.push(`\`${label}.sha256\` : 64 caractères hexadécimaux attendus`);
  }
}

/**
 * Valide le manifeste (`index.json`).
 *
 * @param {unknown} manifest
 * @param {{expectedTotal?: number}} [options]
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateManifest(manifest, { expectedTotal } = {}) {
  if (!isPlainObject(manifest)) {
    return { valid: false, errors: ['manifeste : objet attendu'] };
  }

  const errors = [];

  if (manifest.schemaVersion !== SCHEMA_VERSION) {
    errors.push(
      `\`schemaVersion\` attendu ${SCHEMA_VERSION}, reçu ${JSON.stringify(manifest.schemaVersion)}`
    );
  }
  if (!isNonEmptyString(manifest.catalogVersion)) {
    errors.push('champ `catalogVersion` requis (chaîne non vide)');
  }
  if (!isDateString(manifest.updatedAt)) {
    errors.push('champ `updatedAt` : date invalide');
  }

  if (!isPlainObject(manifest.counts)) {
    errors.push('champ `counts` requis (objet)');
  } else {
    if (!Number.isInteger(manifest.counts.total) || manifest.counts.total < 0) {
      errors.push('`counts.total` requis (entier ≥ 0)');
    } else if (typeof expectedTotal === 'number' && manifest.counts.total !== expectedTotal) {
      errors.push(`\`counts.total\` ${manifest.counts.total} ≠ nombre d’icônes ${expectedTotal}`);
    }
    if (!isPlainObject(manifest.counts.bySource)) {
      errors.push('`counts.bySource` requis (objet)');
    }
    if (!isPlainObject(manifest.counts.byCategory)) {
      errors.push('`counts.byCategory` requis (objet)');
    }
  }

  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    errors.push('`sources` requis (tableau non vide)');
  } else {
    const ids = manifest.sources.map((entry) => entry?.id);
    for (const source of SOURCES) {
      if (!ids.includes(source)) errors.push(`\`sources\` : source « ${source} » absente`);
    }
    manifest.sources.forEach((entry, index) => {
      if (isNonEmptyString(entry?.id) && !SOURCES.includes(entry.id)) {
        errors.push(`\`sources[${index}].id\` inconnu : « ${entry.id} »`);
      }
      if (!Number.isInteger(entry?.count) || entry.count < 0) {
        errors.push(`\`sources[${index}].count\` requis (entier ≥ 0)`);
      }
    });
  }

  if (!Array.isArray(manifest.categories)) {
    errors.push('`categories` requis (tableau)');
  } else {
    manifest.categories.forEach((entry, index) => {
      if (isNonEmptyString(entry?.id) && !CATEGORIES.includes(entry.id)) {
        errors.push(`\`categories[${index}].id\` hors taxonomie : « ${entry.id} »`);
      }
      if (!Number.isInteger(entry?.count) || entry.count < 0) {
        errors.push(`\`categories[${index}].count\` requis (entier ≥ 0)`);
      }
    });
  }

  if (!Array.isArray(manifest.shards) || manifest.shards.length === 0) {
    errors.push('`shards` requis (tableau non vide)');
  } else {
    manifest.shards.forEach((shard, index) => {
      if (!isNonEmptyString(shard?.type)) {
        errors.push(`\`shards[${index}].type\` requis (chaîne non vide)`);
      }
      if (!Number.isInteger(shard?.count) || shard.count < 0) {
        errors.push(`\`shards[${index}].count\` requis (entier ≥ 0)`);
      }
      validateFileRef(shard, `shards[${index}]`, errors);
    });
  }

  validateFileRef(manifest.searchIndex, 'searchIndex', errors);
  validateFileRef(manifest.summary, 'summary', errors);

  return { valid: errors.length === 0, errors };
}

/** Nombre maximal d'erreurs détaillées dans le message d'exception. */
const MAX_REPORTED_ERRORS = 20;

/**
 * Point d'entrée pour le build : lève une `Error` lisible si l'un des
 * artefacts est invalide, ne fait rien sinon.
 *
 * @param {{icons?: unknown, summary?: unknown, manifest?: unknown}} artefacts
 * @returns {void}
 */
export function assertValidCatalogue({ icons, summary, manifest } = {}) {
  const errors = [];

  if (icons !== undefined) errors.push(...validateIcons(icons).errors);

  const expectedTotal = Array.isArray(icons) ? icons.length : undefined;

  if (summary !== undefined) {
    errors.push(...validateSummary(summary, { expectedTotal }).errors);
  }
  if (manifest !== undefined) {
    errors.push(...validateManifest(manifest, { expectedTotal }).errors);
  }

  if (errors.length === 0) return;

  const details = errors.slice(0, MAX_REPORTED_ERRORS).map((error) => `  - ${error}`);
  const extra =
    errors.length > MAX_REPORTED_ERRORS
      ? `\n  … et ${errors.length - MAX_REPORTED_ERRORS} autre(s)`
      : '';
  throw new Error(
    `Catalogue invalide (${errors.length} erreur(s)) :\n${details.join('\n')}${extra}`
  );
}
