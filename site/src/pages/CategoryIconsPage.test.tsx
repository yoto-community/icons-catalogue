import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { Icon } from '../types';
import { I18nProvider } from '../i18n';
import { FavoritesProvider } from '../context/FavoritesContext';
import { CategoryIconsPage } from './CategoryIconsPage';

// Contexte de données remplacé : on teste la page seule, avec des données
// injectées (même stratégie que IconsBrowser.test.tsx / AuthorIconsPage.test.tsx).
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
    category: 'nature',
    subcategory: 'lune',
    downloads: 0,
    date_added: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const icons = [
  icon({ id: 'n1', category: 'nature', subcategory: 'lune' }),
  icon({ id: 'n2', category: 'nature', subcategory: 'soleil' }),
  icon({ id: 'o1', category: 'objets', subcategory: 'autre' }),
];

function renderPage(path: string) {
  return render(
    <I18nProvider defaultLocale="fr">
      <FavoritesProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="/categories/:category"
              element={
                <CategoryIconsPage
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

describe('CategoryIconsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('locale', 'fr');
    dataContext.value = {
      ...dataContext.value,
      icons,
      isLoading: false,
      categories: ['nature', 'objets'],
    };
  });

  it('affiche l’état de chargement pendant le chargement des données', () => {
    dataContext.value = { ...dataContext.value, isLoading: true };
    const { container } = renderPage('/categories/nature');

    expect(container.querySelector('.spinner')).not.toBeNull();
    expect(container.querySelectorAll('.icon-card')).toHaveLength(0);
  });

  it('affiche un état introuvable pour une catégorie inconnue', () => {
    const { container } = renderPage('/categories/inconnue');

    expect(container.querySelector('.category-page')).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Catégorie introuvable' })
    ).toBeInTheDocument();
    expect(container.querySelectorAll('.icon-card')).toHaveLength(0);
  });

  it('filtre les icônes de la catégorie et adapte le placeholder', () => {
    const { container } = renderPage('/categories/nature');

    expect(container.querySelectorAll('.icon-card')).toHaveLength(2);
    expect(screen.getByPlaceholderText('Rechercher dans Nature…')).toBeInTheDocument();
    expect(container.querySelector('#category-filter')).toBeNull(); // catégorie imposée
  });

  it('normalise la casse de la catégorie dans l’URL', () => {
    const { container } = renderPage('/categories/NATURE');
    expect(container.querySelectorAll('.icon-card')).toHaveLength(2);
  });

  it('accepte une catégorie absente de la liste tant qu’elle n’est pas chargée', () => {
    dataContext.value = { ...dataContext.value, categories: [] };
    const { container } = renderPage('/categories/nature');

    // Pas de liste de catégories chargée : on ne peut pas conclure « introuvable ».
    expect(container.querySelector('.category-page')).toBeNull();
    expect(container.querySelectorAll('.icon-card')).toHaveLength(2);
  });

  it('affiche l’état vide quand la catégorie n’a aucune icône', () => {
    dataContext.value = {
      ...dataContext.value,
      icons: [icon({ id: 'o1', category: 'objets' })],
    };
    const { container } = renderPage('/categories/nature');

    expect(container.querySelectorAll('.icon-card')).toHaveLength(0);
    expect(container.querySelector('.empty-state')).not.toBeNull();
  });
});
