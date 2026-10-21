import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { Icon } from '../types';
import { I18nProvider } from '../i18n';
import { FavoritesProvider } from '../context/FavoritesContext';
import { AuthorIconsPage } from './AuthorIconsPage';

// Le contexte de données est remplacé : on teste la vue seule, avec des
// données injectées (même stratégie que IconsBrowser.test.tsx).
const dataContext = vi.hoisted(() => ({
  value: {
    icons: [] as Icon[],
    searchEngine: null,
    isLoading: false,
    isSearchReady: true,
    categories: [] as string[],
    subcategories: [] as string[],
    subcategoriesByCategory: {} as Record<string, string[]>,
    summary: null,
  },
}));

vi.mock('../context/IconsDataContext', () => ({
  useIconsData: () => dataContext.value,
}));

function icon(overrides: Partial<Icon> & { id: string }): Icon {
  return {
    source: 'yotoicons',
    tags: [],
    artist: '@alice',
    title: overrides.id,
    preview_image: 'p.png',
    download_url: 'd.png',
    category: 'animaux',
    subcategory: 'animal',
    downloads: 0,
    date_added: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const icons = [
  icon({ id: 'yi-alice-1', artist: '@alice', category: 'animaux' }),
  icon({ id: 'yi-alice-2', artist: '@alice', category: 'nature' }),
  icon({ id: 'yi-bob-1', artist: '@bob', category: 'nature' }),
];

function renderAuthor(path: string) {
  return render(
    <I18nProvider defaultLocale="fr">
      <FavoritesProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/authors/:artist"
              element={
                <AuthorIconsPage
                  onOpenDetail={vi.fn()}
                  onCloseDetail={vi.fn()}
                  onPreview={vi.fn()}
                  selectedIcon={null}
                  previewedIcon={null}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      </FavoritesProvider>
    </I18nProvider>
  );
}

describe('AuthorIconsPage', () => {
  // jsdom expose `navigator.language = "en-US"` : on force le français pour
  // des assertions de libellés déterministes.
  beforeEach(() => {
    localStorage.setItem('locale', 'fr');
    dataContext.value = { ...dataContext.value, icons, isLoading: false };
  });

  it("affiche clairement le nom de l'auteur", () => {
    renderAuthor('/authors/%40alice');
    expect(screen.getByRole('heading', { level: 1, name: '@alice' })).toBeInTheDocument();
  });

  it("affiche le nombre d'icônes de l'auteur", () => {
    renderAuthor('/authors/%40alice');
    expect(screen.getByText('2 icônes', { selector: '.author-page-count' })).toBeInTheDocument();
  });

  it('affiche un état introuvable pour un auteur inconnu', () => {
    renderAuthor('/authors/%40inconnu');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Auteur introuvable' })
    ).toBeInTheDocument();
  });
});
