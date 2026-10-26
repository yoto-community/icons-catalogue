import { useEffect, useMemo, useState } from 'react';
import type { Icon, SortOption } from '../types';
import type { SearchEngine } from '../searchEngine';

interface UseFilteredIconsProps {
  icons: Icon[];
  searchEngine: SearchEngine | null;
  query: string;
  category: string;
  subcategory: string;
  source: string;
  sortBy: SortOption;
}

/**
 * Filtre et trie les icônes selon la recherche textuelle et les filtres.
 *
 * La recherche Lunr est désormais asynchrone (index construit dans un Web
 * Worker) : les IDs correspondants sont stockés en état et réappliqués au
 * filtre. Tant que la requête est en vol, le filtre texte précédent est
 * conservé pour éviter un clignotement de la grille.
 */
export function useFilteredIcons({
  icons,
  searchEngine,
  query,
  category,
  subcategory,
  source,
  sortBy,
}: UseFilteredIconsProps): Icon[] {
  const trimmedQuery = query.trim();
  const [matchingIds, setMatchingIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    // Requête vide : pas de filtre texte.
    if (!trimmedQuery || !searchEngine) {
      setMatchingIds(null);
      return;
    }

    let cancelled = false;
    searchEngine
      .search(trimmedQuery)
      .then((ids) => {
        if (!cancelled) setMatchingIds(new Set(ids));
      })
      .catch(() => {
        if (!cancelled) setMatchingIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, [trimmedQuery, searchEngine]);

  return useMemo(() => {
    let result = icons;

    // Filtre par recherche textuelle (résultats asynchrones du worker)
    if (trimmedQuery && matchingIds) {
      result = result.filter((icon) => matchingIds.has(icon.id));
    }

    if (category) {
      result = result.filter((icon) => icon.category === category);
    }

    if (subcategory) {
      result = result.filter((icon) => icon.subcategory === subcategory);
    }

    if (source) {
      result = result.filter((icon) => icon.source === source);
    }

    // Tri sur une copie : ne jamais muter le tableau `icons` du contexte.
    return [...result].sort((a, b) => {
      if (sortBy === 'downloads') return (b.downloads || 0) - (a.downloads || 0);
      return a.title.localeCompare(b.title);
    });
  }, [icons, trimmedQuery, matchingIds, category, subcategory, source, sortBy]);
}
