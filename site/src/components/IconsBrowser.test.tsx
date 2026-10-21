import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Icon } from '../types';
import { I18nProvider } from '../i18n';
import { FavoritesProvider } from '../context/FavoritesContext';
import { IconsBrowser } from './IconsBrowser';

// Le contexte de données fournit le moteur de recherche et le résumé ; on le
// remplace pour tester la vue seule (les données sont injectées par props).
const dataContext = vi.hoisted(() => ({
  value: {
    icons: [] as Icon[],
    searchEngine: null,
    isLoading: false,
    isSearchReady: true,
    isComplete: true,
    error: null as string | null,
    reload: () => {},
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
    source: 'yotopixels',
    tags: [],
    artist: '@auteur',
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

function renderBrowser(ui: ReactNode) {
  return render(
    <I18nProvider defaultLocale="fr">
      <FavoritesProvider>
        <MemoryRouter>{ui}</MemoryRouter>
      </FavoritesProvider>
    </I18nProvider>
  );
}

const twoIcons = [icon({ id: 'a' }), icon({ id: 'b' })];

describe('IconsBrowser', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('locale', 'fr');
    window.history.replaceState(null, '', '/');
  });

  it('affiche la recherche, les filtres, la grille et la barre latérale', () => {
    const { container } = renderBrowser(
      <IconsBrowser
        icons={twoIcons}
        categories={['nature']}
        getSubcategories={() => ['lune']}
        onOpenDetail={vi.fn()}
        onPreview={vi.fn()}
        previewedIcon={null}
      />
    );

    expect(container.querySelector('#search-input')).not.toBeNull();
    expect(container.querySelector('#category-filter')).not.toBeNull();
    expect(container.querySelectorAll('.icon-card')).toHaveLength(2);
    expect(container.querySelector('.results-sidebar')).not.toBeNull();
  });

  it('masque le filtre catégorie et utilise le placeholder quand la catégorie est imposée', () => {
    const { container } = renderBrowser(
      <IconsBrowser
        icons={twoIcons}
        categories={['nature']}
        getSubcategories={() => ['lune']}
        lockedCategory="nature"
        searchPlaceholder="Rechercher dans Nature"
        onOpenDetail={vi.fn()}
        onPreview={vi.fn()}
        previewedIcon={null}
      />
    );

    expect(container.querySelector('#category-filter')).toBeNull();
    expect(screen.getByPlaceholderText('Rechercher dans Nature')).toBeInTheDocument();
  });

  it("affiche l'état vide quand aucune icône ne correspond", () => {
    const { container } = renderBrowser(
      <IconsBrowser
        icons={[]}
        categories={['nature']}
        getSubcategories={() => []}
        onOpenDetail={vi.fn()}
        onPreview={vi.fn()}
        previewedIcon={null}
      />
    );

    expect(container.querySelector('.empty-state')).not.toBeNull();
    expect(container.querySelectorAll('.icon-card')).toHaveLength(0);
  });

  it("signale le chargement d'arrière-plan tant que tout n'est pas chargé", () => {
    dataContext.value.isComplete = false;
    const { rerender } = renderBrowser(
      <IconsBrowser
        icons={twoIcons}
        categories={['nature']}
        getSubcategories={() => ['lune']}
        onOpenDetail={vi.fn()}
        onPreview={vi.fn()}
        previewedIcon={null}
      />
    );

    expect(screen.getByText(/chargement du reste du catalogue/i)).toBeInTheDocument();

    dataContext.value.isComplete = true;
    rerender(
      <I18nProvider defaultLocale="fr">
        <FavoritesProvider>
          <MemoryRouter>
            <IconsBrowser
              icons={twoIcons}
              categories={['nature']}
              getSubcategories={() => ['lune']}
              onOpenDetail={vi.fn()}
              onPreview={vi.fn()}
              previewedIcon={null}
            />
          </MemoryRouter>
        </FavoritesProvider>
      </I18nProvider>
    );
    expect(screen.queryByText(/chargement du reste du catalogue/i)).toBeNull();
  });

  it('propose un réessai si un shard a échoué après le premier', () => {
    const reload = vi.fn();
    dataContext.value.isComplete = false;
    dataContext.value.error = 'HTTP 500';
    dataContext.value.reload = reload;

    renderBrowser(
      <IconsBrowser
        icons={twoIcons}
        categories={['nature']}
        getSubcategories={() => ['lune']}
        onOpenDetail={vi.fn()}
        onPreview={vi.fn()}
        previewedIcon={null}
      />
    );

    expect(screen.getByText(/interrompu/i)).toBeInTheDocument();
    screen.getByRole('button', { name: /réessayer/i }).click();
    expect(reload).toHaveBeenCalledTimes(1);

    dataContext.value.error = null;
    dataContext.value.reload = () => {};
  });

  it('affiche le sélecteur de couleur uniquement quand il est activé', () => {
    const props = {
      icons: twoIcons,
      categories: ['nature'],
      getSubcategories: () => ['lune'],
      onOpenDetail: vi.fn(),
      onPreview: vi.fn(),
      previewedIcon: null,
    };

    const withSelector = renderBrowser(<IconsBrowser {...props} showBackgroundColorSelector />);
    expect(withSelector.container.querySelectorAll('.results-sidebar > *')).toHaveLength(2);
    withSelector.unmount();

    const withoutSelector = renderBrowser(<IconsBrowser {...props} />);
    expect(withoutSelector.container.querySelectorAll('.results-sidebar > *')).toHaveLength(1);
  });

  it('rend l’en-tête fourni au-dessus de la recherche', () => {
    renderBrowser(
      <IconsBrowser
        icons={twoIcons}
        categories={['nature']}
        getSubcategories={() => ['lune']}
        header={<a href="/categories">retour</a>}
        onOpenDetail={vi.fn()}
        onPreview={vi.fn()}
        previewedIcon={null}
      />
    );

    expect(screen.getByRole('link', { name: 'retour' })).toBeInTheDocument();
  });
});
