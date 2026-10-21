import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Icon } from '../types';
import { I18nProvider } from '../i18n';
import { FavoritesProvider } from '../context/FavoritesContext';
import { IconCard } from './IconCard';

function makeIcon(overrides: Partial<Icon> = {}): Icon {
  return {
    id: 'yi-alice-1',
    source: 'yotoicons',
    tags: ['chat'],
    artist: '@alice',
    title: 'Un chat',
    preview_image: 'https://example.com/1.png',
    download_url: 'https://example.com/1.png',
    category: 'animaux',
    subcategory: 'chat',
    downloads: 42,
    date_added: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderCard(icon: Icon = makeIcon(), highlight?: string) {
  const onOpenDetail = vi.fn();
  const onPreview = vi.fn();
  const view = render(
    <I18nProvider defaultLocale="fr">
      <FavoritesProvider>
        <MemoryRouter>
          <IconCard
            icon={icon}
            onOpenDetail={onOpenDetail}
            onPreview={onPreview}
            highlight={highlight}
          />
        </MemoryRouter>
      </FavoritesProvider>
    </I18nProvider>
  );
  return { onOpenDetail, onPreview, ...view };
}

describe('IconCard', () => {
  // jsdom expose `navigator.language = "en-US"`, ce qui ferait basculer le
  // provider sur l'anglais : on force le français pour tester les libellés.
  beforeEach(() => {
    localStorage.setItem('locale', 'fr');
  });

  it("expose l'auteur comme lien vers sa page", () => {
    const { onOpenDetail } = renderCard();

    const link = screen.getByRole('link', { name: 'Auteur : @alice' });
    expect(link).toHaveAttribute('href', '/authors/%40alice');

    // Cliquer sur l'auteur navigue : ça ne doit PAS ouvrir la modale de détail.
    fireEvent.click(link);
    expect(onOpenDetail).not.toHaveBeenCalled();
  });

  it('ouvre le détail au clic sur le reste de la carte', () => {
    const { onOpenDetail } = renderCard();

    fireEvent.click(screen.getByRole('button', { name: /Voir les détails/ }));
    expect(onOpenDetail).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas de lien auteur quand l'auteur est absent", () => {
    renderCard(makeIcon({ artist: '' }));
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('affiche un badge « Doublon » pour une icône marquée inter-sources', () => {
    renderCard(makeIcon({ metadata: { duplicate_of: 'yo-123' } }));
    expect(screen.getByText('Doublon')).toBeInTheDocument();
  });

  it("n'affiche pas de badge doublon par défaut", () => {
    renderCard();
    expect(screen.queryByText('Doublon')).toBeNull();
  });

  it('surligne le terme recherché dans le titre et les tags (P3.5)', () => {
    const { container } = renderCard(makeIcon({ title: 'Un chat noir', tags: ['chat'] }), 'chat');

    expect(container.querySelector('.icon-title mark')?.textContent).toBe('chat');
    expect(container.querySelector('.tag mark')?.textContent).toBe('chat');
  });

  it('ne surligne rien sans requête de recherche', () => {
    const { container } = renderCard(makeIcon({ title: 'Un chat noir', tags: ['chat'] }));
    expect(container.querySelector('mark')).toBeNull();
  });
});
