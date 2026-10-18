import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import type { Icon, SortOption } from '../types';
import { useIconsData } from '../hooks/useIconsData';
import { useFilteredIcons } from '../hooks/useFilteredIcons';
import { usePagination } from '../hooks/usePagination';
import { useUrlSync } from '../hooks/useUrlSync';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import {
  SearchBar,
  Filters,
  StatsBar,
  IconsGrid,
  EmptyState,
  Pagination,
  YotoMiniPreview,
  LoadingState,
} from '../components';

const CATEGORY_LABELS: Record<string, string> = {
  objets: 'Objets',
  nature: 'Nature',
  animaux: 'Animaux',
  musique: 'Musique',
  personnages: 'Personnages',
  fetes: 'Fêtes',
  transport: 'Transport',
  activites: 'Activités',
  emotions: 'Émotions',
  nourriture: 'Nourriture',
  batiments: 'Bâtiments',
  formes: 'Formes',
};

export function CategoryIconsPage({
  onOpenDetail,
  onCloseDetail,
  onPreview,
  selectedIcon,
  previewedIcon,
}: {
  onOpenDetail: (icon: Icon) => void;
  onCloseDetail: () => void;
  onPreview: (icon: Icon, e: React.MouseEvent) => void;
  selectedIcon: Icon | null;
  previewedIcon: Icon | null;
}) {
  const { category: categoryParam } = useParams<{ category: string }>();
  const location = useLocation();

  // Data loading
  const {
    icons,
    index,
    isIndexLoaded,
    isLoading,
    categories,
    summary,
  } = useIconsData();

  // Get current category
  const currentCategory = useMemo(() => {
    if (!categoryParam) return '';
    // Normalize the category from URL (decode and match case-insensitively)
    const decoded = decodeURIComponent(categoryParam);
    const match = categories.find(c => c.toLowerCase() === decoded.toLowerCase());
    return match || decoded;
  }, [categoryParam, categories]);

  // Filter state
  const [query, setQuery] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('downloads');

  // Get subcategories for the current category
  const categorySubcategories = useMemo(() => {
    if (!currentCategory) return [];
    return [...new Set(
      icons
        .filter(icon => icon.category === currentCategory)
        .map(icon => icon.subcategory)
        .filter(Boolean)
    )].sort();
  }, [icons, currentCategory]);

  // Filter icons by current category first, then apply other filters
  const filteredIcons = useFilteredIcons({
    icons: icons.filter(icon => icon.category === currentCategory),
    index,
    query,
    category: '', // Already filtered by category above
    subcategory,
    sortBy,
  });

  // Pagination
  const {
    paginatedIcons,
    currentPage,
    totalPages,
    totalFiltered,
    handlePageChange,
    setCurrentPage,
  } = usePagination({ filteredIcons });

  // URL sync
  const { syncUrl } = useUrlSync({
    query,
    category: '', // Don't sync category - it's in the URL path
    subcategory,
    sortBy,
    currentPage,
  });

  // Debounced search
  const { performSearch, handleQueryChange } = useDebouncedSearch({
    onSearch: () => {
      setCurrentPage(1);
    },
    onUrlSync: syncUrl,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleQueryChange(e.target.value, setQuery);
  };

  const handleSubcategoryChange = useCallback((value: string) => {
    setSubcategory(value);
    performSearch();
  }, [performSearch]);

  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
    performSearch();
  }, [performSearch]);

  const handleReset = useCallback(() => {
    setQuery('');
    setSubcategory('');
    setSortBy('downloads');
    setCurrentPage(1);
  }, [setCurrentPage]);

  const hasActiveFilters = Boolean(query.trim() || subcategory);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    query,
    performSearch,
    selectedIcon,
    closeIconDetail: onCloseDetail,
  });

  // Restore from URL (initial load only) - only subcategory, sort, page
  // Note: query is handled by useDebouncedSearch via URL sync
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('subcat')) setSubcategory(params.get('subcat')!);
    if (params.get('sort')) setSortBy(params.get('sort') as SortOption);
    if (params.get('page')) setCurrentPage(Math.max(1, Number(params.get('page'))));
  }, [setCurrentPage, setSubcategory, setSortBy]);

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Category not found (only check after categories are loaded)
  if (currentCategory && categories.length > 0 && !categories.includes(currentCategory)) {
    return (
      <section className="category-page" aria-labelledby="category-title">
        <header className="category-header">
          <Link to="/categories" className="back-link" aria-label="Retour aux catégories">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Catégories
          </Link>
          <h1 id="category-title">Catégorie introuvable</h1>
          <p className="category-intro">La catégorie demandée n'existe pas.</p>
        </header>
      </section>
    );
  }

  const categoryLabel = currentCategory
    ? CATEGORY_LABELS[currentCategory] || currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)
    : '';

  return (
    <>
      <div className="category-page-header">
        <Link to="/categories" className="back-link" aria-label="Retour aux catégories">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Toutes les catégories
        </Link>
      </div>
      <SearchBar query={query} onChange={handleSearchChange} autoFocus={!query} placeholder={`Rechercher dans ${categoryLabel}…`} />

      <Filters
        category={currentCategory}
        subcategory={subcategory}
        sortBy={sortBy}
        categories={[currentCategory].filter(Boolean)}
        subcategories={categorySubcategories}
        summary={summary ?? undefined}
        hasActiveFilters={hasActiveFilters}
        onCategoryChange={() => {}}
        onSubcategoryChange={handleSubcategoryChange}
        onSortChange={handleSortChange}
        onReset={handleReset}
        hideCategoryFilter
      />

      <StatsBar
        totalFiltered={totalFiltered}
        query={query}
        category={currentCategory}
        subcategory={subcategory}
        summary={summary ?? undefined}
      />

      <section className="results-section" aria-live="polite" aria-busy={!isIndexLoaded}>
        <div className="results-layout">
          <div className="icons-grid-wrapper">
            {paginatedIcons.length === 0 ? (
              <EmptyState
                query={query}
                hasActiveFilters={hasActiveFilters}
                onReset={handleReset}
                isLoading={isLoading}
              />
            ) : (
              <IconsGrid
                icons={paginatedIcons}
                onOpenDetail={onOpenDetail}
                onPreview={onPreview}
              />
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          <YotoMiniPreview previewedIcon={previewedIcon} />
        </div>
      </section>
    </>
  );
}