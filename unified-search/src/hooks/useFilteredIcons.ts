import { useMemo } from 'react';
import lunr from 'lunr';
import type { Icon, SortOption } from '../types';

interface UseFilteredIconsProps {
  icons: Icon[];
  index: lunr.Index | null;
  query: string;
  category: string;
  subcategory: string;
  sortBy: SortOption;
}

export function useFilteredIcons({
  icons,
  index,
  query,
  category,
  subcategory,
  sortBy,
}: UseFilteredIconsProps): Icon[] {
  return useMemo(() => {
    if (!icons.length) return [];

    let result = icons;

    // Filtre par recherche textuelle (Lunr)
    if (query.trim() && index) {
      const results = index.search(query);
      const matchingIds = new Set(results.map((r: { ref: string }) => r.ref));
      result = result.filter(icon => matchingIds.has(icon.id));
    }

    // Filtre par catégorie
    if (category) {
      result = result.filter(icon => icon.category === category);
    }

    // Filtre par sous-catégorie
    if (subcategory) {
      result = result.filter(icon => icon.subcategory === subcategory);
    }

    // Tri
    result.sort((a, b) => {
      if (sortBy === 'downloads') return (b.downloads || 0) - (a.downloads || 0);
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'date') return new Date(b.date_added).getTime() - new Date(a.date_added).getTime();
      return 0;
    });

    return result;
  }, [icons, index, query, category, subcategory, sortBy]);
}