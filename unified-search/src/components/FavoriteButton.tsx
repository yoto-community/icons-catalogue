import { useFavorites } from '../context/FavoritesContext';
import { useI18n } from '../i18n';

interface FavoriteButtonProps {
  id: string;
  size?: 'sm' | 'normal';
  variant?: 'icon' | 'icon-text';
  onToggle?: (isFavorite: boolean) => void;
}

export function FavoriteButton({
  id,
  size = 'normal',
  variant = 'icon',
  onToggle,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useI18n();
  const favorite = isFavorite(id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent click handlers (like opening detail modal)
    const added = toggleFavorite(id);
    onToggle?.(added);
  };

  return (
    <button
      type="button"
      className={`favorite-btn favorite-btn--${size} favorite-btn--${variant} ${favorite ? 'is-favorite' : ''}`}
      onClick={handleClick}
      aria-pressed={favorite}
      aria-label={favorite ? t('favoriteButton.removeAria') : t('favoriteButton.addAria')}
      title={favorite ? t('favoriteButton.removeTitle') : t('favoriteButton.addTitle')}
    >
      {/* Outline heart */}
      <svg
        className="favorite-icon favorite-icon--outline"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      {/* Filled heart */}
      <svg
        className="favorite-icon favorite-icon--filled"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      {variant === 'icon-text' && (
        <span className="favorite-text">
          {favorite ? t('favoriteButton.removeText') : t('favoriteButton.favoriteText')}
        </span>
      )}
    </button>
  );
}
