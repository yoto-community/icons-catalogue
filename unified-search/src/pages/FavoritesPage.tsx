import { useFavorites } from '../context/FavoritesContext';
import { IconsGrid } from '../components/IconsGrid';
import { EmptyState } from '../components/EmptyState';
import type { Icon } from '../types';

export function FavoritesPage({ allIcons }: { allIcons: Icon[] }) {
  const { favorites } = useFavorites();
  const favoriteIds = Array.from(favorites);
  const favoriteIcons = allIcons.filter(icon => favoriteIds.includes(icon.id));

  const handleOpenDetail = (icon: Icon) => {
    // This will be overridden by the parent App component
    window.dispatchEvent(new CustomEvent('icon-open-detail', { detail: icon }));
  };

  const handlePreview = (icon: Icon, e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('icon-preview', { detail: icon }));
  };

  if (favoriteIcons.length === 0) {
    return (
      <section className="favorites-page" aria-labelledby="favorites-title">
        <header className="favorites-header">
          <h1 id="favorites-title">Mes favoris</h1>
          <p className="favorites-intro">
            Vos icônes préférées, sauvegardées localement dans votre navigateur.
          </p>
        </header>
        <EmptyState
          query=""
          hasActiveFilters={false}
          onReset={() => {}}
          isLoading={false}
        />
      </section>
    );
  }

  return (
    <section className="favorites-page" aria-labelledby="favorites-title">
      <header className="favorites-header">
        <h1 id="favorites-title">Mes favoris</h1>
        <p className="favorites-intro">
          {favoriteIcons.length} icône{favoriteIcons.length > 1 ? 's' : ''} favorite{favoriteIcons.length > 1 ? 's' : ''} —
          sauvegardées localement dans votre navigateur, synchronisées entre onglets.
        </p>
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