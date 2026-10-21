import { useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import type { Icon } from '../types';
import { useIconsData } from '../context/IconsDataContext';
import { useKeyboardShortcuts } from '../hooks';
import { BackLink, IconsBrowser, LoadingState } from '../components';
import { useI18n } from '../i18n';

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
  const { t } = useI18n();

  const { icons, isLoading } = useIconsData();

  const currentArtist = useMemo(
    () => (artistParam ? decodeURIComponent(artistParam) : ''),
    [artistParam]
  );

  // Icônes de l'auteur, mémoïsées (évite un nouveau tableau à chaque rendu).
  const artistIcons = useMemo(
    () => icons.filter((icon) => icon.artist === currentArtist),
    [icons, currentArtist]
  );

  const artistCategories = useMemo(
    () => [...new Set(artistIcons.map((icon) => icon.category).filter(Boolean))].sort(),
    [artistIcons]
  );

  // Sous-catégories de l'auteur, restreintes à la catégorie sélectionnée.
  const getSubcategories = useCallback(
    (category: string) =>
      [
        ...new Set(
          artistIcons
            .filter((icon) => !category || icon.category === category)
            .map((icon) => icon.subcategory)
            .filter(Boolean)
        ),
      ].sort(),
    [artistIcons]
  );

  useKeyboardShortcuts({
    selectedIcon,
    closeIconDetail: onCloseDetail,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  const initial = currentArtist.charAt(0).toUpperCase();
  const isAtSign = initial === '@';

  // Auteur inconnu (vérifié seulement une fois les icônes chargées).
  if (currentArtist && icons.length > 0 && artistIcons.length === 0) {
    return (
      <section className="author-page" aria-labelledby="author-title">
        <header className="author-header">
          <BackLink to="/authors">{t('authors.backToAuthors')}</BackLink>
          <h1 id="author-title">{t('authors.notFound')}</h1>
          <p className="author-intro">{t('authors.notFoundMessage')}</p>
        </header>
      </section>
    );
  }

  return (
    <IconsBrowser
      icons={artistIcons}
      categories={artistCategories}
      getSubcategories={getSubcategories}
      searchPlaceholder={t('search.placeholderAuthor', { artist: currentArtist })}
      header={
        <div className="author-page-header">
          <BackLink to="/authors">{t('authors.allAuthorsLink')}</BackLink>
          <div className="author-page-title">
            <div
              className={`author-avatar${isAtSign ? ' author-avatar--at' : ''}`}
              aria-hidden="true"
            >
              {initial}
            </div>
            <div className="author-page-headings">
              <h1 className="author-page-name">{currentArtist}</h1>
              <p className="author-page-count">
                {t('common.iconsCount', { count: artistIcons.length })}
              </p>
            </div>
          </div>
        </div>
      }
      onOpenDetail={onOpenDetail}
      onPreview={onPreview}
      previewedIcon={previewedIcon}
    />
  );
}
