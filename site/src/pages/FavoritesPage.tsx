import { useMemo, useState } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { IconsGrid } from '../components/IconsGrid';
import { EmptyState } from '../components/EmptyState';
import type { Icon } from '../types';
import { useI18n } from '../i18n';
import { emitWindowCustomEvent } from '../utils/windowEvents';
import { buildFavoritesArchive, downloadBytes } from '../utils/exportFavorites';

export function FavoritesPage({ allIcons }: { allIcons: Icon[] }) {
  const { favorites } = useFavorites();
  const { t } = useI18n();
  const [exportStatus, setExportStatus] = useState<'idle' | 'exporting' | 'error'>('idle');

  // `favorites` est un Set : la recherche est en O(1) par icône.
  const favoriteIcons = useMemo(
    () => allIcons.filter((icon) => favorites.has(icon.id)),
    [allIcons, favorites]
  );

  // Le modal et l'aperçu vivent dans `App` : la page publie des événements
  // typés plutôt que de dupliquer cet état.
  const handleOpenDetail = (icon: Icon) => {
    emitWindowCustomEvent<Icon>('icon-open-detail', icon);
  };

  const handlePreview = (icon: Icon, e: React.MouseEvent) => {
    e.stopPropagation();
    emitWindowCustomEvent<Icon>('icon-preview', icon);
  };

  // Construit l'archive (images + manifeste) puis déclenche le téléchargement.
  const handleExport = async () => {
    setExportStatus('exporting');
    try {
      const archive = await buildFavoritesArchive(favoriteIcons);
      downloadBytes(archive.bytes, archive.filename);
      setExportStatus('idle');
    } catch {
      setExportStatus('error');
    }
  };

  // Libellé visible = préfixe du nom accessible (règle axe
  // `label-content-name-mismatch`).
  const exportLabel =
    exportStatus === 'exporting' ? t('favorites.exporting') : t('favorites.export');

  if (favoriteIcons.length === 0) {
    return (
      <section className="favorites-page" aria-labelledby="favorites-title">
        <header className="favorites-header">
          <h1 id="favorites-title">{t('favorites.title')}</h1>
          <p className="favorites-intro">{t('favorites.emptyIntro')}</p>
        </header>
        <EmptyState query="" hasActiveFilters={false} onReset={() => {}} isLoading={false} />
      </section>
    );
  }

  return (
    <section className="favorites-page" aria-labelledby="favorites-title">
      <header className="favorites-header">
        <h1 id="favorites-title">{t('favorites.title')}</h1>
        <p className="favorites-intro">{t('favorites.intro', { count: favoriteIcons.length })}</p>
        <div className="favorites-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={exportStatus === 'exporting'}
            aria-label={`${exportLabel} — ${t('favorites.exportAria', { count: favoriteIcons.length })}`}
          >
            {exportLabel}
          </button>
          {exportStatus === 'error' && (
            <p className="favorites-export-error" role="alert">
              {t('favorites.exportError')}
            </p>
          )}
        </div>
      </header>

      <div className="favorites-grid-wrapper">
        <IconsGrid
          icons={favoriteIcons}
          onOpenDetail={handleOpenDetail}
          onPreview={handlePreview}
        />
      </div>
    </section>
  );
}
