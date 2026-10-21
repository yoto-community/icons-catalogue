import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { Icon } from '../types';
import { useIconsData } from '../context/IconsDataContext';
import { useKeyboardShortcuts } from '../hooks';
import { BackLink, IconsBrowser, LoadingState } from '../components';
import { useI18n } from '../i18n';
import { getCategoryLabel } from '../constants';

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
  const { t } = useI18n();

  const { icons, isLoading, categories } = useIconsData();

  // Normalise la catégorie de l'URL (décodage + correspondance insensible à la casse).
  const currentCategory = useMemo(() => {
    if (!categoryParam) return '';
    const decoded = decodeURIComponent(categoryParam);
    const match = categories.find((c) => c.toLowerCase() === decoded.toLowerCase());
    return match || decoded;
  }, [categoryParam, categories]);

  // Icônes de la catégorie, mémoïsées (évite un nouveau tableau à chaque rendu).
  const categoryIcons = useMemo(
    () => icons.filter((icon) => icon.category === currentCategory),
    [icons, currentCategory]
  );

  // Les sous-catégories sont déjà limitées au périmètre de la catégorie.
  const getSubcategories = useCallback(
    () => [...new Set(categoryIcons.map((icon) => icon.subcategory).filter(Boolean))].sort(),
    [categoryIcons]
  );

  useKeyboardShortcuts({
    selectedIcon,
    closeIconDetail: onCloseDetail,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  // Catégorie inconnue (vérifié seulement une fois les catégories chargées).
  if (currentCategory && categories.length > 0 && !categories.includes(currentCategory)) {
    return (
      <section className="category-page" aria-labelledby="category-title">
        <header className="category-header">
          <BackLink to="/categories">{t('categories.backToCategories')}</BackLink>
          <h1 id="category-title">{t('categories.notFound')}</h1>
          <p className="category-intro">{t('categories.notFoundMessage')}</p>
        </header>
      </section>
    );
  }

  return (
    <IconsBrowser
      icons={categoryIcons}
      categories={[currentCategory].filter(Boolean)}
      getSubcategories={getSubcategories}
      lockedCategory={currentCategory}
      searchPlaceholder={t('search.placeholderCategory', {
        category: getCategoryLabel(currentCategory, t),
      })}
      header={
        <div className="category-page-header">
          <BackLink to="/categories">{t('categories.allCategoriesLink')}</BackLink>
        </div>
      }
      onOpenDetail={onOpenDetail}
      onPreview={onPreview}
      previewedIcon={previewedIcon}
    />
  );
}
