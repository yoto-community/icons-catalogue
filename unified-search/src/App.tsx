import { useState, useCallback, useEffect, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { Icon, SortOption } from './types';
import { useIconsData } from './context/IconsDataContext';
import {
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
  BackgroundColorSelector,
} from './components';
import {
  FavoritesPage,
  CategoriesListPage,
  CategoryIconsPage,
  AuthorsListPage,
  AuthorIconsPage,
  DevelopersPage,
} from './pages';
import { normalizeUrl } from './utils/iconUtils';
import { toSortOption, toPageNumber } from './utils/urlParams';
import { onWindowCustomEvent } from './utils/windowEvents';

function CataloguePage({
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
  // Données partagées via contexte (chargées une seule fois pour toute l'app)
  const {
    icons,
    searchEngine,
    isLoading,
    isSearchReady,
    categories,
    subcategories,
    subcategoriesByCategory,
    summary,
  } = useIconsData();

  // Filter state
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('downloads');
  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('yoto-icons-background-color');
      return saved === 'default' ? undefined : saved || undefined;
    }
    return undefined;
  });

  // Filtrer les sous-catégories selon la catégorie sélectionnée
  const filteredSubcategories = useMemo(() => {
    if (!category) return subcategories;
    return subcategoriesByCategory[category] || [];
  }, [category, subcategories, subcategoriesByCategory]);

  // Filtered icons
  const filteredIcons = useFilteredIcons({
    icons,
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

  // Handle query change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleQueryChange(e.target.value, setQuery);
  };

  // Filter handlers
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

  const handleBackgroundColorChange = useCallback(
    (value: string | undefined) => {
      setBackgroundColor(value);
      performSearch();
    },
    [performSearch]
  );

  // Persist background color to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (backgroundColor) {
        localStorage.setItem('yoto-icons-background-color', backgroundColor);
      } else {
        localStorage.setItem('yoto-icons-background-color', 'default');
      }
    }
  }, [backgroundColor]);

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

  // Restauration depuis l'URL (initial load)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) setQuery(params.get('q')!);
    if (params.get('cat')) setCategory(params.get('cat')!);
    if (params.get('subcat')) setSubcategory(params.get('subcat')!);
    if (params.get('sort')) setSortBy(toSortOption(params.get('sort')));
    if (params.get('page')) setCurrentPage(toPageNumber(params.get('page')));
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
        subcategories={filteredSubcategories}
        summary={summary ?? undefined}
        hasActiveFilters={hasActiveFilters}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
        onSortChange={handleSortChange}
        onReset={handleReset}
        hideCategoryFilter={false}
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
              <IconsGrid
                icons={paginatedIcons}
                onOpenDetail={onOpenDetail}
                onPreview={onPreview}
                backgroundColor={backgroundColor}
              />
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          <aside className="results-sidebar">
            <BackgroundColorSelector
              backgroundColor={backgroundColor}
              onChange={handleBackgroundColorChange}
            />

            <YotoMiniPreview previewedIcon={previewedIcon} />
          </aside>
        </div>
      </section>
    </>
  );
}

function App() {
  // Données partagées (chargées UNE fois par IconsDataProvider).
  // Le rendu n'attend plus la construction de l'index Lunr (~1,5 s) :
  // celle-ci se fait désormais dans un Web Worker, en arrière-plan.
  const { icons, summary } = useIconsData();

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
    const unsubscribeOpenDetail = onWindowCustomEvent<Icon>('icon-open-detail', (e) =>
      openIconDetail(e.detail)
    );
    const unsubscribePreview = onWindowCustomEvent<Icon>('icon-preview', (e) =>
      setPreviewedIcon(e.detail)
    );

    return () => {
      unsubscribeOpenDetail();
      unsubscribePreview();
    };
  }, [openIconDetail]);

  // Les icônes peuvent encore être en cours de chargement : les pages
  // gèrent elles-mêmes leur état vide/chargement (LoadingState).
  return (
    <div className="app">
      <Header />

      <main className="main">
        <Routes>
          <Route
            path="/"
            element={
              <CataloguePage
                onOpenDetail={openIconDetail}
                onCloseDetail={closeIconDetail}
                onPreview={handlePreview}
                selectedIcon={selectedIcon}
                previewedIcon={previewedIcon}
              />
            }
          />
          <Route path="/favorites" element={<FavoritesPage allIcons={icons} />} />
          <Route path="/categories" element={<CategoriesListPage summary={summary} />} />
          <Route
            path="/categories/:category"
            element={
              <CategoryIconsPage
                onOpenDetail={openIconDetail}
                onCloseDetail={closeIconDetail}
                onPreview={handlePreview}
                selectedIcon={selectedIcon}
                previewedIcon={previewedIcon}
              />
            }
          />
          <Route path="/authors" element={<AuthorsListPage summary={summary} />} />
          <Route
            path="/authors/:artist"
            element={
              <AuthorIconsPage
                onOpenDetail={openIconDetail}
                onCloseDetail={closeIconDetail}
                onPreview={handlePreview}
                selectedIcon={selectedIcon}
                previewedIcon={previewedIcon}
              />
            }
          />
          <Route path="/developers" element={<DevelopersPage />} />
        </Routes>
      </main>

      <Footer />

      <IconDetailModal icon={selectedIcon} onClose={closeIconDetail} onDownload={handleDownload} />
    </div>
  );
}

export default App;
