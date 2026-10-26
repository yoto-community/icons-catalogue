import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Icon, SortOption } from '../types';
import type { SearchEngine } from '../searchEngine';
import { useFilteredIcons } from './useFilteredIcons';
import { usePagination } from './usePagination';
import { useUrlSync } from './useUrlSync';
import { useDebouncedSearch } from './useDebouncedSearch';
import { toSortOption, toPageNumber, toSourceFilter, DEFAULT_SORT } from '../utils/urlParams';

export interface UseIconsBrowserOptions {
  /** Icônes du périmètre : catalogue complet, catégorie ou auteur. */
  icons: Icon[];
  searchEngine: SearchEngine | null;
  /**
   * Catégorie imposée (page catégorie). Quand elle est fournie, la catégorie
   * n'est ni affichée comme filtre modifiable, ni synchronisée dans l'URL
   * (elle figure déjà dans le chemin `/categories/:category`).
   */
  lockedCategory?: string;
  /** Résout les sous-catégories à proposer pour la catégorie courante. */
  getSubcategories: (category: string) => string[];
  /** Restaure les filtres depuis la query-string au montage (défaut : true). */
  restoreFromUrl?: boolean;
}

/**
 * État et logique communs aux trois vues de navigation (catalogue, catégorie,
 * auteur) : filtres, recherche débouncée, pagination et synchronisation d'URL.
 *
 * Auparavant dupliqués dans `App.tsx`, `CategoryIconsPage` et
 * `AuthorIconsPage` ; toute correction devait être répétée trois fois.
 */
export function useIconsBrowser({
  icons,
  searchEngine,
  lockedCategory,
  getSubcategories,
  restoreFromUrl = true,
}: UseIconsBrowserOptions) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(lockedCategory ?? '');
  const [subcategory, setSubcategory] = useState('');
  const [source, setSource] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(DEFAULT_SORT);

  const subcategories = useMemo(() => getSubcategories(category), [getSubcategories, category]);

  const filteredIcons = useFilteredIcons({
    icons,
    searchEngine,
    query,
    category,
    subcategory,
    source,
    sortBy,
  });

  const {
    paginatedIcons,
    currentPage,
    totalPages,
    totalFiltered,
    handlePageChange,
    setCurrentPage,
  } = usePagination({ filteredIcons });

  // Une catégorie imposée ne doit pas être réécrite dans la query-string.
  const { syncUrl } = useUrlSync({
    query,
    category: lockedCategory ? '' : category,
    subcategory,
    source,
    sortBy,
    currentPage,
  });

  const { performSearch, handleQueryChange } = useDebouncedSearch({
    onSearch: () => setCurrentPage(1),
    onUrlSync: syncUrl,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleQueryChange(e.target.value, setQuery);
  };

  const handleCategoryChange = useCallback(
    (value: string) => {
      setCategory(value);
      setSubcategory(''); // La sous-catégorie n'a plus de sens dans une autre catégorie.
      performSearch();
    },
    [performSearch]
  );

  const handleSubcategoryChange = useCallback(
    (value: string) => {
      setSubcategory(value);
      performSearch();
    },
    [performSearch]
  );

  const handleSourceChange = useCallback(
    (value: string) => {
      setSource(value);
      performSearch();
    },
    [performSearch]
  );

  const handleSortChange = useCallback(
    (value: SortOption) => {
      setSortBy(value);
      performSearch();
    },
    [performSearch]
  );

  const handleReset = useCallback(() => {
    setQuery('');
    setCategory(lockedCategory ?? '');
    setSubcategory('');
    setSource('');
    setSortBy(DEFAULT_SORT);
    setCurrentPage(1);
  }, [setCurrentPage, lockedCategory]);

  // La catégorie imposée n'est pas un « filtre actif » : elle est toujours là.
  const hasActiveFilters = Boolean(
    query.trim() || subcategory || source || (!lockedCategory && category)
  );

  // Restauration depuis l'URL, au montage uniquement.
  useEffect(() => {
    if (!restoreFromUrl) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) setQuery(params.get('q')!);
    if (!lockedCategory && params.get('cat')) setCategory(params.get('cat')!);
    if (params.get('subcat')) setSubcategory(params.get('subcat')!);
    setSource(toSourceFilter(params.get('source')));
    if (params.get('sort')) setSortBy(toSortOption(params.get('sort')));
    if (params.get('page')) setCurrentPage(toPageNumber(params.get('page')));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restauration volontairement limitée au montage : la relancer écraserait les filtres en cours de saisie.
  }, []);

  return {
    query,
    category,
    subcategory,
    source,
    sortBy,
    subcategories,
    paginatedIcons,
    currentPage,
    totalPages,
    totalFiltered,
    hasActiveFilters,
    performSearch,
    handleSearchChange,
    handleCategoryChange,
    handleSubcategoryChange,
    handleSourceChange,
    handleSortChange,
    handlePageChange,
    handleReset,
  };
}
