import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { SummaryData } from '../types';
import { I18nProvider } from '../i18n';
import { CategoriesListPage } from './CategoriesListPage';

function summaryWith(byCategory: Record<string, number>, total = 0): SummaryData {
  return {
    schemaVersion: 2,
    catalogVersion: '2026.01.01-1',
    updatedAt: '2026-01-01T00:00:00.000Z',
    total,
    counts: {
      bySource: {},
      byCategory,
      byArtist: {},
      bySubcategory: {},
      topTags: {},
      topArtists: {},
    },
  };
}

function renderPage(summary: SummaryData | null, path = '/categories') {
  return render(
    <I18nProvider defaultLocale="fr">
      <MemoryRouter initialEntries={[path]}>
        <CategoriesListPage summary={summary} />
      </MemoryRouter>
    </I18nProvider>
  );
}

function categoryLinks(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll('.category-link')].map((a) => a.getAttribute('href'));
}

describe('CategoriesListPage', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'fr');
  });

  it('affiche l’état de chargement tant que le résumé est absent', () => {
    const { container } = renderPage(null);

    expect(screen.getByRole('heading', { level: 1, name: 'Catégories' })).toBeInTheDocument();
    expect(container.querySelector('.categories-grid')).toBeNull();
    expect(screen.getByText('Chargement des catégories…')).toBeInTheDocument();
  });

  it('affiche l’état de chargement quand le décompte par catégorie manque', () => {
    const summary = { ...summaryWith({}), counts: undefined as never };
    const { container } = renderPage(summary);
    expect(container.querySelector('.categories-grid')).toBeNull();
  });

  it('trie les catégories par nombre d’icônes décroissant', () => {
    const { container } = renderPage(summaryWith({ objets: 3, nature: 10, animaux: 5 }, 18));

    expect(categoryLinks(container)).toEqual([
      '/categories/nature',
      '/categories/animaux',
      '/categories/objets',
    ]);
  });

  it('affiche le libellé et le nombre d’icônes (pluriel correct)', () => {
    const { container } = renderPage(summaryWith({ nature: 1, animaux: 2 }, 3));

    const cards = [...container.querySelectorAll('.category-card')];
    const natureCard = cards.find(
      (c) => c.querySelector('a')?.getAttribute('href') === '/categories/nature'
    );
    const animauxCard = cards.find(
      (c) => c.querySelector('a')?.getAttribute('href') === '/categories/animaux'
    );

    expect(natureCard?.querySelector('.category-name')?.textContent).toBe('Nature');
    expect(natureCard?.querySelector('.category-count')?.textContent?.trim()).toBe('1 icône');
    expect(animauxCard?.querySelector('.category-count')?.textContent?.trim()).toBe('2 icônes');
  });

  it('marque la catégorie courante comme active', () => {
    const { container } = renderPage(summaryWith({ nature: 4 }), '/categories/nature');

    const card = container.querySelector('.category-card');
    expect(card?.classList.contains('is-active')).toBe(true);
    expect(card?.querySelector('.category-link')).toHaveAttribute('aria-current', 'page');
  });

  it('n’active aucune carte en dehors d’une catégorie', () => {
    const { container } = renderPage(summaryWith({ nature: 4 }), '/categories');
    expect(container.querySelector('.category-card')?.classList.contains('is-active')).toBe(false);
  });

  it('affiche un message quand aucune catégorie n’est disponible', () => {
    const { container } = renderPage(summaryWith({}));

    expect(container.querySelectorAll('.category-card')).toHaveLength(0);
    expect(screen.getByText('Aucune catégorie disponible pour le moment.')).toBeInTheDocument();
  });
});
