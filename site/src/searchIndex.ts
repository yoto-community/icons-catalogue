import lunr from 'lunr';
import type { Icon } from './types';

/**
 * Champs indexés pour la recherche full-text.
 * `tags` est boosté ×10 car c'est le signal le plus pertinent du catalogue.
 */
export const SEARCH_FIELDS: ReadonlyArray<{ name: string; boost?: number }> = [
  { name: 'tags', boost: 10 },
  { name: 'artist' },
  { name: 'title' },
  { name: 'category' },
  { name: 'subcategory' },
];

/** Données minimales requises pour construire l'index (découpage mémoire). */
export type SearchableIcon = Pick<
  Icon,
  'id' | 'tags' | 'artist' | 'title' | 'category' | 'subcategory'
>;

/**
 * Retire les diacritiques puis met en minuscules
 * (`Café` → `cafe`, `Fête` → `fete`).
 *
 * Utilisé par le repli « naïf » (`searchIdsFallback`). L'index Lunr applique
 * l'équivalent via le pipeline `stripDiacritics` (voir `buildSearchIndex`) :
 * indexation et requête sont ainsi normalisées de la même façon.
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Fonction de pipeline Lunr retirant les diacritiques d'un token.
 *
 * Insérée **avant** le `stemmer` dans les deux pipelines (documents ET
 * requêtes) : c'est ce qui rend la recherche insensible aux accents sans
 * toucher aux opérateurs (`OR`, `+`, `*`) que Lunr analyse séparément.
 */
function stripDiacritics(token: lunr.Token): lunr.Token {
  return token.update((value) => value.normalize('NFD').replace(/\p{Diacritic}/gu, ''));
}

const STRIP_DIACRITICS_LABEL = 'stripDiacritics';
let stripDiacriticsRegistered = false;

function registerStripDiacritics(): void {
  if (stripDiacriticsRegistered) return;
  lunr.Pipeline.registerFunction(stripDiacritics, STRIP_DIACRITICS_LABEL);
  stripDiacriticsRegistered = true;
}

/**
 * Construit l'index Lunr à partir des icônes.
 *
 * Coût mesuré : ~1,1 s pour ~27 000 icônes (`pnpm run measure:search`). Ce temps
 * NE DOIT PAS être passé sur le main thread : appeler via le Web Worker
 * (searchIndex.worker.ts) ou, en repli, en différé.
 */
export function buildSearchIndex(icons: SearchableIcon[]): lunr.Index {
  registerStripDiacritics();
  return lunr(function (this: lunr.Builder) {
    this.ref('id');
    for (const field of SEARCH_FIELDS) {
      this.field(field.name, { boost: field.boost });
    }

    // Accents ignorés de part et d'autre (index + requêtes).
    // NB : AVANT le `trimmer`, qui supprime les caractères non-ASCII en fin de
    // mot (« café » → « caf ») et rendrait l'accentuation incohérente.
    this.pipeline.before(lunr.trimmer, stripDiacritics);
    this.searchPipeline.before(lunr.stemmer, stripDiacritics);

    for (const icon of icons) {
      this.add({
        id: icon.id,
        tags: icon.tags,
        artist: icon.artist,
        title: icon.title,
        category: icon.category,
        subcategory: icon.subcategory,
      });
    }
  });
}

/** Réduit une icône complète à sa version indexable (transfert vers le worker). */
export function toSearchableIcon(icon: Icon): SearchableIcon {
  return {
    id: icon.id,
    tags: icon.tags,
    artist: icon.artist,
    title: icon.title,
    category: icon.category,
    subcategory: icon.subcategory,
  };
}

/**
 * Extrait les IDs correspondant à une requête, avec repli « naïf » si
 * l'index n'est pas encore disponible (évite de perdre l'utilisateur).
 */
export function searchIdsFallback(icons: SearchableIcon[], query: string): Set<string> {
  const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return new Set(icons.map((i) => i.id));

  const matches = new Set<string>();
  for (const icon of icons) {
    const haystack = normalizeForSearch(
      [icon.title, icon.artist, icon.category, icon.subcategory, ...icon.tags].join(' ')
    );
    if (terms.every((term) => haystack.includes(term))) {
      matches.add(icon.id);
    }
  }
  return matches;
}
