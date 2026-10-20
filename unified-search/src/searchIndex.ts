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
 * Construit l'index Lunr à partir des icônes.
 *
 * Coût mesuré : ~1,5 s pour 27 000 icônes. Ce temps NE DOIT PAS être passé
 * sur le main thread : appeler via le Web Worker (searchIndex.worker.ts) ou,
 * en repli, en différé.
 */
export function buildSearchIndex(icons: SearchableIcon[]): lunr.Index {
  return lunr(function (this: lunr.Builder) {
    this.ref('id');
    for (const field of SEARCH_FIELDS) {
      this.field(field.name, { boost: field.boost });
    }

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
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return new Set(icons.map((i) => i.id));

  const matches = new Set<string>();
  for (const icon of icons) {
    const haystack = [icon.title, icon.artist, icon.category, icon.subcategory, ...icon.tags]
      .join(' ')
      .toLowerCase();
    if (terms.every((term) => haystack.includes(term))) {
      matches.add(icon.id);
    }
  }
  return matches;
}
