import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Icon } from '../types';
import { useI18n } from '../i18n';
import { useIconsData } from '../context/IconsDataContext';
import { useIconsBrowser } from '../hooks/useIconsBrowser';
import { SearchBar } from './SearchBar';
import { Filters } from './Filters';
import { StatsBar } from './StatsBar';
import { IconsGrid } from './IconsGrid';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { YotoMiniPreview } from './YotoMiniPreview';
import { BackgroundColorSelector } from './BackgroundColorSelector';

const BACKGROUND_COLOR_KEY = 'yoto-icons-background-color';

export interface IconsBrowserProps {
  /** Icônes du périmètre (catalogue complet, catégorie ou auteur). */
  icons: Icon[];
  /** Catégories proposées dans le filtre. */
  categories: string[];
  /** Résout les sous-catégories proposées pour la catégorie courante. */
  getSubcategories: (category: string) => string[];
  /** Catégorie imposée (page catégorie) : filtre masqué, hors URL. */
  lockedCategory?: string;
  /** Placeholder de la barre de recherche (ex. « Rechercher dans Nature… »). */
  searchPlaceholder?: string;
  /** En-tête au-dessus de la recherche (ex. lien retour). */
  header?: ReactNode;
  /** Affiche le sélecteur de couleur de fond dans la barre latérale. */
  showBackgroundColorSelector?: boolean;
  onOpenDetail: (icon: Icon) => void;
  onPreview: (icon: Icon, e: React.MouseEvent) => void;
  previewedIcon: Icon | null;
}

/**
 * Vue de navigation partagée : recherche, filtres, statistiques, grille
 * paginée et barre latérale.
 *
 * Extraite de `App.tsx`, `CategoryIconsPage` et `AuthorIconsPage`, qui
 * dupliquaient ce bloc — et chacun de ses correctifs. Elle lit le contexte de
 * données (moteur de recherche, résumé) et délègue l'état à `useIconsBrowser`.
 */
export function IconsBrowser({
  icons,
  categories,
  getSubcategories,
  lockedCategory,
  searchPlaceholder,
  header,
  showBackgroundColorSelector = false,
  onOpenDetail,
  onPreview,
  previewedIcon,
}: IconsBrowserProps) {
  const { t } = useI18n();
  const { searchEngine, isSearchReady, isComplete, error, reload, summary } = useIconsData();

  const {
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
  } = useIconsBrowser({ icons, searchEngine, lockedCategory, getSubcategories });

  const [backgroundColor, setBackgroundColor] = useState<string | undefined>(() => {
    if (!showBackgroundColorSelector || typeof window === 'undefined') return undefined;
    const saved = localStorage.getItem(BACKGROUND_COLOR_KEY);
    return saved === 'default' ? undefined : saved || undefined;
  });

  useEffect(() => {
    if (!showBackgroundColorSelector || typeof window === 'undefined') return;
    localStorage.setItem(BACKGROUND_COLOR_KEY, backgroundColor ?? 'default');
  }, [backgroundColor, showBackgroundColorSelector]);

  const handleBackgroundColorChange = useCallback(
    (value: string | undefined) => {
      setBackgroundColor(value);
      performSearch();
    },
    [performSearch]
  );

  return (
    <>
      {header}

      <SearchBar
        query={query}
        onChange={handleSearchChange}
        autoFocus={!query}
        placeholder={searchPlaceholder}
      />

      <Filters
        category={category}
        subcategory={subcategory}
        source={source}
        sortBy={sortBy}
        categories={categories}
        subcategories={subcategories}
        summary={summary ?? undefined}
        hasActiveFilters={hasActiveFilters}
        onCategoryChange={handleCategoryChange}
        onSubcategoryChange={handleSubcategoryChange}
        onSourceChange={handleSourceChange}
        onSortChange={handleSortChange}
        onReset={handleReset}
        hideCategoryFilter={Boolean(lockedCategory)}
      />

      <StatsBar
        totalFiltered={totalFiltered}
        query={query}
        category={category}
        subcategory={subcategory}
        summary={summary ?? undefined}
      />

      <section className="results-section" aria-live="polite" aria-busy={!isSearchReady}>
        {!isComplete && !error && (
          <p className="results-loading" role="status">
            {t('catalogue.loadingMore')}
          </p>
        )}
        {!isComplete && error && icons.length > 0 && (
          <p className="results-loading results-loading--error" role="alert">
            {t('catalogue.loadError')}{' '}
            <button type="button" className="btn-retry" onClick={reload}>
              {t('errorState.retry')}
            </button>
          </p>
        )}
        <div className="results-layout">
          <div className="icons-grid-wrapper">
            {paginatedIcons.length === 0 ? (
              <EmptyState query={query} hasActiveFilters={hasActiveFilters} onReset={handleReset} />
            ) : (
              <IconsGrid
                icons={paginatedIcons}
                onOpenDetail={onOpenDetail}
                onPreview={onPreview}
                backgroundColor={showBackgroundColorSelector ? backgroundColor : undefined}
                highlight={query}
              />
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          <aside className="results-sidebar">
            {showBackgroundColorSelector && (
              <BackgroundColorSelector
                backgroundColor={backgroundColor}
                onChange={handleBackgroundColorChange}
              />
            )}

            <YotoMiniPreview previewedIcon={previewedIcon} />
          </aside>
        </div>
      </section>
    </>
  );
}
