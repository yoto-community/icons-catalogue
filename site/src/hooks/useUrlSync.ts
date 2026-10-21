import { useCallback, useEffect, useRef } from 'react';
import type { SortOption } from '../types';
import { DEFAULT_SORT } from '../utils/urlParams';

export interface UseUrlSyncProps {
  query: string;
  category: string;
  subcategory: string;
  source: string;
  license: string;
  sortBy: SortOption;
  currentPage: number;
}

/**
 * Synchronise les filtres avec la query-string de l'URL.
 *
 * Le hook n'expose que `syncUrl` : l'écriture est déclenchée explicitement par
 * l'appelant (via `useDebouncedSearch.onUrlSync`) pour ne pas écraser l'URL à
 * chaque frappe. La restauration au montage est, elle, gérée par
 * `useIconsBrowser`.
 *
 * `syncUrl` lit les valeurs courantes depuis une ref plutôt que de les
 * capturer. L'écriture étant débouncée, la closure planifiée provenait d'un
 * rendu antérieur à la mise à jour d'état : l'URL était donc toujours en retard
 * d'un changement (ex. `?source=` absent juste après une sélection).
 */
export function useUrlSync(props: UseUrlSyncProps) {
  const paramsRef = useRef(props);

  useEffect(() => {
    paramsRef.current = props;
  });

  const syncUrl = useCallback(() => {
    const { query, category, subcategory, source, license, sortBy, currentPage } =
      paramsRef.current;
    const params = new URLSearchParams(window.location.search);
    if (query.trim()) params.set('q', query.trim());
    else params.delete('q');
    if (category) params.set('cat', category);
    else params.delete('cat');
    if (subcategory) params.set('subcat', subcategory);
    else params.delete('subcat');
    if (source) params.set('source', source);
    else params.delete('source');
    if (license) params.set('license', license);
    else params.delete('license');
    if (sortBy !== DEFAULT_SORT) params.set('sort', sortBy);
    else params.delete('sort');
    if (currentPage > 1) params.set('page', String(currentPage));
    else params.delete('page');

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    history.replaceState(null, '', newUrl);
  }, []);

  return { syncUrl };
}
