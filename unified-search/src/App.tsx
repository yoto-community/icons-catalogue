import { useState, useCallback, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { Icon, SortOption } from './types';
import {
  useIconsData,
  useFilteredIcons,
  usePagination,
  useUrlSync,
  useKeyboardShortcuts,
  useDebouncedSearch,
} from './hooks';
import {
  Header,
  SearchBar,
  Filters,
  StatsBar,
  IconsGrid,
  EmptyState,
  Pagination,
  YotoMiniPreview,
  IconDetailModal,
  Footer,
  LoadingState,
} from './components';
import { FavoritesPage } from './pages/FavoritesPage';
import { normalizeUrl } from './utils/iconUtils';

function CataloguePage({
  icons,
  index,
  isIndexLoaded,
  isLoading,
  categories,
  subcategories,
  summary,
  onOpenDetail,
  onCloseDetail,
  onPreview,
  selectedIcon,
  previewedIcon,
}: {
  icons: Icon[];
  index: any;
  isIndexLoaded: boolean;
  isLoading: boolean;
  categories: string[];
  subcategories: string[];
  summary: any;
  onOpenDetail: (icon: Icon) => void;
  onCloseDetail: () => void;
  onPreview: (icon: Icon, e: React.MouseEvent) => void;
  selectedIcon: Icon | null;
  previewedIcon: Icon | null;
}) {
  // Filter state
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('downloads');

  // Filtered icons
  const filteredIcons = useFilteredIcons({
    icons,
    index,
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

  // Handle query change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleQueryChange(e.target.value, setQuery);
  };

  // Filter handlers
  const handleCategoryChange = useCallback((value: string) => {
    setCategory(value);
    setSubcategory(''); // Reset subcategory when category changes
    performSearch();
  }, [performSearch]);

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
    setCategory('');
    setSubcategory('');
    setSortBy('downloads');
    setCurrentPage(1);
  }, [setCurrentPage]);

  const hasActiveFilters = Boolean(query.trim() || category || subcategory);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    query,
    performSearch,
    selectedIcon,
    closeIconDetail: onCloseDetail,
  });

  // Restauration depuis l'URL (initial load)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) setQuery(params.get('q')!);
    if (params.get('cat')) setCategory(params.get('cat')!);
    if (params.get('subcat')) setSubcategory(params.get('subcat')!);
    if (params.get('sort')) setSortBy(params.get('sort') as SortOption);
    if (params.get('page')) setCurrentPage(Math.max(1, Number(params.get('page'))));
  }, [setCurrentPage]);

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <>
      <SearchBar query={query} onChange={handleSearchChange} autoFocus={!query} />

      <Filters
        category={category}
        subcategory={subcategory}
        sortBy={sortBy}
        categories={categories}
        subcategories={subcategories}
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

function App() {
  // Data loading
  const {
    icons,
    index,
    isIndexLoaded,
    isLoading,
    categories,
    subcategories,
    summary,
  } = useIconsData();

  // Modal state
  const [selectedIcon, setSelectedIcon] = useState<Icon | null>(null);
  const [previewedIcon, setPreviewedIcon] = useState<Icon | null>(null);

  // Open modal
  const openIconDetail = useCallback((icon: Icon) => {
    setSelectedIcon(icon);
    document.body.style.overflow = 'hidden';
  }, []);

  // Close modal
  const closeIconDetail = useCallback(() => {
    setSelectedIcon(null);
    document.body.style.overflow = '';
  }, []);

  // Handle download
  const handleDownload = useCallback((icon: Icon) => {
    const url = normalizeUrl(icon.download_url || icon.preview_image, icon.source);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${icon.title}.png`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Handle preview
  const handlePreview = useCallback((icon: Icon, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher l'ouverture du modal
    setPreviewedIcon(icon);
  }, []);

  // Handle global events from FavoritesPage
  useEffect(() => {
    const handleOpenDetail = (e: CustomEvent<Icon>) => {
      openIconDetail(e.detail);
    };

    const handlePreviewEvent = (e: CustomEvent<Icon>) => {
      setPreviewedIcon(e.detail);
    };

    window.addEventListener('icon-open-detail', handleOpenDetail as EventListener);
    window.addEventListener('icon-preview', handlePreviewEvent as EventListener);

    return () => {
      window.removeEventListener('icon-open-detail', handleOpenDetail as EventListener);
      window.removeEventListener('icon-preview', handlePreviewEvent as EventListener);
    };
  }, [openIconDetail]);

  return (
    <div className="app">
      <Header />

      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              <CataloguePage
                icons={icons}
                index={index}
                isIndexLoaded={isIndexLoaded}
                isLoading={isLoading}
                categories={categories}
                subcategories={subcategories}
                summary={summary}
                onOpenDetail={openIconDetail}
                onCloseDetail={closeIconDetail}
                onPreview={handlePreview}
                selectedIcon={selectedIcon}
                previewedIcon={previewedIcon}
              />
            }
          />
          <Route
            path="/favorites"
            element={<FavoritesPage allIcons={icons} />}
          />
        </Routes>
      </main>

      <Footer />

      <IconDetailModal
        icon={selectedIcon}
        onClose={closeIconDetail}
        onDownload={handleDownload}
      />
    </div>
  );
}

export default App;