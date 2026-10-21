import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { FavoriteButton } from './FavoriteButton';

// Le contexte des favoris est remplacé : on pilote directement l'état et on
// observe les appels à `toggleFavorite`.
const fav = vi.hoisted(() => ({ isFavorite: vi.fn(), toggleFavorite: vi.fn() }));

vi.mock('../context/FavoritesContext', () => ({
  useFavorites: () => ({
    favorites: new Set<string>(),
    isFavorite: fav.isFavorite,
    toggleFavorite: fav.toggleFavorite,
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    clearFavorites: vi.fn(),
  }),
}));

function renderButton(props: Partial<Parameters<typeof FavoriteButton>[0]> = {}) {
  return render(
    <I18nProvider defaultLocale="fr">
      <FavoriteButton id="icon-1" {...props} />
    </I18nProvider>
  );
}

describe('FavoriteButton', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'fr');
    fav.isFavorite.mockReset();
    fav.toggleFavorite.mockReset();
    fav.isFavorite.mockReturnValue(false);
    fav.toggleFavorite.mockReturnValue(true);
  });

  it('affiche l’état « non favori » par défaut', () => {
    renderButton();
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button.classList.contains('is-favorite')).toBe(false);
  });

  it('affiche l’état « favori » quand l’icône est déjà enregistrée', () => {
    fav.isFavorite.mockReturnValue(true);
    renderButton();
    const button = screen.getByRole('button');

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button.classList.contains('is-favorite')).toBe(true);
  });

  it('bascule le favori au clic et remonte le nouvel état', () => {
    const onToggle = vi.fn();
    renderButton({ onToggle });

    fireEvent.click(screen.getByRole('button'));

    expect(fav.toggleFavorite).toHaveBeenCalledWith('icon-1');
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('n’ouvre pas le détail parent (stopPropagation)', () => {
    const parentClick = vi.fn();
    render(
      <I18nProvider defaultLocale="fr">
        <div onClick={parentClick}>
          <FavoriteButton id="icon-1" />
        </div>
      </I18nProvider>
    );

    fireEvent.click(screen.getByRole('button'));

    expect(parentClick).not.toHaveBeenCalled();
  });

  it('affiche le libellé texte uniquement en variante « icon-text »', () => {
    const { container } = renderButton({ variant: 'icon-text' });
    expect(container.querySelector('.favorite-text')).not.toBeNull();
  });

  it('n’affiche pas de texte en variante « icon »', () => {
    const { container } = renderButton({ variant: 'icon' });
    expect(container.querySelector('.favorite-text')).toBeNull();
  });
});
