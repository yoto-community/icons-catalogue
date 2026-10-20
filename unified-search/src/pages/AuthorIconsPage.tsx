import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import type { Icon, SortOption } from '../types';
import { useIconsData } from '../context/IconsDataContext';
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
import { useI18n } from '../i18n';
import { toSortOption, toPageNumber } from '../utils/urlParams';

export function AuthorIconsPage({
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
  const { artist: artistParam } = useParams<{ artist: string }>();
  const location = useLocation();
  const { t } = useI18n();

  // Data loading (partagé via contexte)
  const { icons, searchEngine, isSearchReady, isLoading, summary } = useIconsData();

  // Get current artist
  const currentArtist = useMemo(() => {
    if (!artistParam) return '';
    // Normalize the artist from URL (decode)
    return decodeURIComponent(artistParam);
  }, [artistParam]);

  // Filter state
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('downloads');

  // Get categories for the current artist
  const artistCategories = useMemo(() => {
    if (!currentArtist) return [];
    return [
      ...new Set(
        icons
          .filter((icon) => icon.artist === currentArtist)
          .map((icon) => icon.category)
          .filter(Boolean)
      ),
    ].sort();
  }, [icons, currentArtist]);

  // Get subcategories for the current artist (and optionally filtered by category)
  const artistSubcategories = useMemo(() => {
    if (!currentArtist) return [];
    return [
      ...new Set(
        icons
          .filter(
            (icon) => icon.artist === currentArtist && (!category || icon.category === category)
          )
          .map((icon) => icon.subcategory)
          .filter(Boolean)
      ),
    ].sort();
  }, [icons, currentArtist, category]);

  // Icônes de l'artiste, mémoïsées (évite un nouveau tableau à chaque rendu)
  const artistIcons = useMemo(
    () => icons.filter((icon) => icon.artist === currentArtist),
    [icons, currentArtist]
  );

  // Filter icons by current artist first, then apply other filters
  const filteredIcons = useFilteredIcons({
    icons: artistIcons,
    searchEngine,
    query,
    category,
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
    category,
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

  const handleCategoryChange = useCallback(
    (value: string) => {
      setCategory(value);
      setSubcategory(''); // Reset subcategory when category changes
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

  const handleSortChange = useCallback(
    (value: SortOption) => {
      setSortBy(value);
      performSearch();
    },
    [performSearch]
  );

  const handleReset = useCallback(() => {
    setQuery('');
    setCategory('');
    setSubcategory('');
    setSortBy('downloads');
    setCurrentPage(1);
  }, [setCurrentPage]);

  const hasActiveFilters = Boolean(query.trim() || category || subcategory);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    selectedIcon,
    closeIconDetail: onCloseDetail,
  });

  // Restore from URL (initial load only)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('q')) setQuery(params.get('q')!);
    if (params.get('cat')) setCategory(params.get('cat')!);
    if (params.get('subcat')) setSubcategory(params.get('subcat')!);
    if (params.get('sort')) setSortBy(toSortOption(params.get('sort')));
    if (params.get('page')) setCurrentPage(toPageNumber(params.get('page')));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restauration volontairement limitée au montage : inclure location.search ré-appliquerait l'URL à chaque rendu et écraserait les filtres en cours de saisie.
  }, [setCurrentPage, setCategory, setSubcategory, setSortBy]);

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Artist not found (only check after artists are loaded)
  // We check if any icon has this artist
  const artistExists = icons.some((icon) => icon.artist === currentArtist);
  if (currentArtist && icons.length > 0 && !artistExists) {
    return (
      <section className="author-page" aria-labelledby="author-title">
        <header className="author-header">
          <Link to="/authors" className="back-link" aria-label={t('common.back')}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t('authors.backToAuthors')}
          </Link>
          <h1 id="author-title">{t('authors.notFound')}</h1>
          <p className="author-intro">{t('authors.notFoundMessage')}</p>
        </header>
      </section>
    );
  }

  return (
    <>
      <div className="author-page-header">
        <Link to="/authors" className="back-link" aria-label={t('common.back')}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t('authors.allAuthorsLink')}
        </Link>
      </div>
      <SearchBar
        query={query}
        onChange={handleSearchChange}
        autoFocus={!query}
        placeholder={t('search.placeholderAuthor', { artist: currentArtist })}
      />

      <Filters
        category={category}
        subcategory={subcategory}
        sortBy={sortBy}
        categories={artistCategories}
        subcategories={artistSubcategories}
        summary={summary ?? undefined}
        hasActiveFilters={hasActiveFilters}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
        onSortChange={handleSortChange}
        onReset={handleReset}
      />

      <StatsBar
        totalFiltered={totalFiltered}
        query={query}
        category={category}
        subcategory={subcategory}
        summary={summary ?? undefined}
      />

      <section className="results-section" aria-live="polite" aria-busy={!isSearchReady}>
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
              <IconsGrid icons={paginatedIcons} onOpenDetail={onOpenDetail} onPreview={onPreview} />
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
