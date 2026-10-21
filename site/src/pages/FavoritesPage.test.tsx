import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Icon } from '../types';
import { I18nProvider } from '../i18n';
import { FavoritesPage } from './FavoritesPage';

// Le contexte des favoris est remplacé : on pilote directement l'ensemble des
// ids favoris, sans dépendre de localStorage.
const favoritesCtx = vi.hoisted(() => ({
  value: {
    favorites: new Set<string>(),
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn(() => true),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    clearFavorites: vi.fn(),
  },
}));

vi.mock('../context/FavoritesContext', () => ({
  useFavorites: () => favoritesCtx.value,
}));

// L'export ZIP est remplacé : on vérifie l'orchestration, pas le zip lui-même
// (couvert par `utils/exportFavorites.test.ts` et `utils/zip.test.ts`).
const exportCtx = vi.hoisted(() => ({
  buildFavoritesArchive: vi.fn(),
  downloadBytes: vi.fn(),
}));

vi.mock('../utils/exportFavorites', () => ({
  buildFavoritesArchive: exportCtx.buildFavoritesArchive,
  downloadBytes: exportCtx.downloadBytes,
}));

function icon(id: string): Icon {
  return {
    id,
    source: 'yotoicons',
    tags: [],
    artist: '@alice',
    title: `Icône ${id}`,
    preview_image: 'p.png',
    download_url: 'd.png',
    category: 'nature',
    subcategory: 'lune',
    downloads: 0,
    date_added: '2024-01-01T00:00:00.000Z',
  };
}

const allIcons = [icon('a'), icon('b'), icon('c')];

function renderPage() {
  return render(
    <I18nProvider defaultLocale="fr">
      <MemoryRouter>
        <FavoritesPage allIcons={allIcons} />
      </MemoryRouter>
    </I18nProvider>
  );
}

describe('FavoritesPage', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'fr');
    favoritesCtx.value = { ...favoritesCtx.value, favorites: new Set<string>() };
    exportCtx.buildFavoritesArchive.mockReset();
    exportCtx.buildFavoritesArchive.mockResolvedValue({
      filename: 'yoto-favorites.zip',
      bytes: new Uint8Array([1]),
      included: 1,
      skipped: 0,
    });
    exportCtx.downloadBytes.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('affiche un état vide sans favori', () => {
    const { container } = renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Mes favoris' })).toBeInTheDocument();
    expect(container.querySelectorAll('.icon-card')).toHaveLength(0);
    expect(container.querySelector('.empty-state')).not.toBeNull();
  });

  it('n’affiche que les icônes favorites', () => {
    favoritesCtx.value = { ...favoritesCtx.value, favorites: new Set(['a', 'c']) };
    const { container } = renderPage();

    expect(container.querySelectorAll('.icon-card')).toHaveLength(2);
    expect(screen.getByText(/2 icônes favorites/)).toBeInTheDocument();
  });

  it('publie un événement d’ouverture au clic sur une carte', () => {
    favoritesCtx.value = { ...favoritesCtx.value, favorites: new Set(['a']) };
    const { container } = renderPage();

    const received: Icon[] = [];
    const handler = (event: Event) => received.push((event as CustomEvent<Icon>).detail);
    window.addEventListener('icon-open-detail', handler);

    container.querySelector<HTMLButtonElement>('.icon-link')?.click();

    window.removeEventListener('icon-open-detail', handler);
    expect(received.map((i) => i.id)).toEqual(['a']);
  });

  it('publie un événement d’aperçu sans ouvrir le détail', () => {
    favoritesCtx.value = { ...favoritesCtx.value, favorites: new Set(['a']) };
    const { container } = renderPage();

    const previews: Icon[] = [];
    const details: Icon[] = [];
    const onPreview = (event: Event) => previews.push((event as CustomEvent<Icon>).detail);
    const onDetail = (event: Event) => details.push((event as CustomEvent<Icon>).detail);
    window.addEventListener('icon-preview', onPreview);
    window.addEventListener('icon-open-detail', onDetail);

    container.querySelector<HTMLButtonElement>('.icon-preview-btn')?.click();

    window.removeEventListener('icon-preview', onPreview);
    window.removeEventListener('icon-open-detail', onDetail);
    expect(previews.map((i) => i.id)).toEqual(['a']);
    expect(details).toHaveLength(0);
  });

  it('exporte les favoris en archive ZIP (P3.2)', async () => {
    favoritesCtx.value = { ...favoritesCtx.value, favorites: new Set(['a', 'c']) };
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Télécharger les 2 icônes favorites/ }));

    await waitFor(() => expect(exportCtx.buildFavoritesArchive).toHaveBeenCalledTimes(1));
    expect((exportCtx.buildFavoritesArchive.mock.calls[0][0] as Icon[]).map((i) => i.id)).toEqual([
      'a',
      'c',
    ]);
    await waitFor(() =>
      expect(exportCtx.downloadBytes).toHaveBeenCalledWith(
        expect.any(Uint8Array),
        'yoto-favorites.zip'
      )
    );
  });

  it('affiche une erreur quand l’export échoue', async () => {
    favoritesCtx.value = { ...favoritesCtx.value, favorites: new Set(['a']) };
    exportCtx.buildFavoritesArchive.mockRejectedValue(new Error('réseau'));
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Télécharger/ }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Échec de l’export de l’archive')
    );
    expect(exportCtx.downloadBytes).not.toHaveBeenCalled();
  });

  it('ne propose pas d’export quand aucun favori n’est enregistré', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: /Télécharger/ })).toBeNull();
  });
});
