import { useCallback, useEffect } from 'react';
import type { SortOption } from '../types';

interface UseUrlSyncProps {
  query: string;
  category: string;
  subcategory: string;
  sortBy: SortOption;
  currentPage: number;
}

export function useUrlSync({
  query,
  category,
  subcategory,
  sortBy,
  currentPage,
}: UseUrlSyncProps) {
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) params.set('q', query.trim());
    else params.delete('q');
    if (category) params.set('cat', category);
    else params.delete('cat');
    if (subcategory) params.set('subcat', subcategory);
    else params.delete('subcat');
    if (sortBy !== 'downloads') params.set('sort', sortBy);
    else params.delete('sort');
    if (currentPage > 1) params.set('page', String(currentPage));
    else params.delete('page');

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    history.replaceState(null, '', newUrl);
  }, [query, category, subcategory, sortBy, currentPage]);

  // Restauration depuis l'URL - handled by parent component
  useEffect(() => {
    // This effect is intentionally empty - URL restoration is done in the parent App component
    // to have access to setState functions
  }, []);

  return { syncUrl };
}