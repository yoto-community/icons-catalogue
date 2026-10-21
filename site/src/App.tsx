import { useState, useCallback, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { Icon } from './types';
import { useIconsData } from './context/IconsDataContext';
import { useKeyboardShortcuts } from './hooks';
import {
  Header,
  Footer,
  LoadingState,
  IconDetailModal,
  IconsBrowser,
  ErrorState,
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
import { onWindowCustomEvent } from './utils/windowEvents';
import { useI18n } from './i18n';

/**
 * Page catalogue : toutes les icônes, recherche et filtres libres.
 * La mécanique de navigation est mutualisée dans `IconsBrowser`.
 */
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
  const { icons, isLoading, categories, subcategories, subcategoriesByCategory } = useIconsData();

  // Sans catégorie sélectionnée, toutes les sous-catégories sont proposées.
  const getSubcategories = useCallback(
    (category: string) => (category ? (subcategoriesByCategory[category] ?? []) : subcategories),
    [subcategories, subcategoriesByCategory]
  );

  useKeyboardShortcuts({
    selectedIcon,
    closeIconDetail: onCloseDetail,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <IconsBrowser
      icons={icons}
      categories={categories}
      getSubcategories={getSubcategories}
      showBackgroundColorSelector
      onOpenDetail={onOpenDetail}
      onPreview={onPreview}
      previewedIcon={previewedIcon}
    />
  );
}

function App() {
  const { t } = useI18n();
  // Données partagées (chargées UNE fois par IconsDataProvider).
  // Le rendu n'attend plus la construction de l'index Lunr (~1,5 s) :
  // celle-ci se fait désormais dans un Web Worker, en arrière-plan.
  const { icons, summary, error, reload } = useIconsData();

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
      <a className="skip-link" href="#main-content">
        {t('a11y.skipToContent')}
      </a>

      <Header />

      <main id="main-content" className="main" tabIndex={-1}>
        {error && icons.length === 0 ? (
          <ErrorState onRetry={reload} />
        ) : (
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
            <Route path="/developers" element={<DevelopersPage summary={summary} />} />
          </Routes>
        )}
      </main>

      <Footer />

      <IconDetailModal icon={selectedIcon} onClose={closeIconDetail} onDownload={handleDownload} />
    </div>
  );
}

export default App;
