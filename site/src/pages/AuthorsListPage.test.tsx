import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { SummaryData } from '../types';
import { I18nProvider } from '../i18n';
import { AuthorsListPage } from './AuthorsListPage';

function summaryWith(byArtist: Record<string, number>, total = 0): SummaryData {
  return {
    schemaVersion: 2,
    catalogVersion: '2026.01.01-1',
    updatedAt: '2026-01-01T00:00:00.000Z',
    total,
    counts: {
      bySource: {},
      byCategory: {},
      byArtist,
      bySubcategory: {},
      topTags: {},
      topArtists: {},
    },
  };
}

function renderPage(summary: SummaryData | null, path = '/authors') {
  return render(
    <I18nProvider defaultLocale="fr">
      <MemoryRouter initialEntries={[path]}>
        <AuthorsListPage summary={summary} />
      </MemoryRouter>
    </I18nProvider>
  );
}

function authorLinks(container: HTMLElement): (string | null)[] {
  return [...container.querySelectorAll('.author-link')].map((a) => a.getAttribute('href'));
}

describe('AuthorsListPage', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'fr');
  });

  it('affiche l’état de chargement tant que le résumé est absent', () => {
    const { container } = renderPage(null);

    expect(screen.getByRole('heading', { level: 1, name: 'Auteurs' })).toBeInTheDocument();
    expect(container.querySelector('.authors-grid')).toBeNull();
  });

  it('affiche l’état de chargement quand le décompte par auteur manque', () => {
    const summary = { ...summaryWith({}), counts: undefined as never };
    const { container } = renderPage(summary);
    expect(container.querySelector('.authors-grid')).toBeNull();
  });

  it('trie les auteurs par nombre d’icônes décroissant', () => {
    const { container } = renderPage(summaryWith({ '@alice': 2, Yoto: 5, '@bob': 1 }, 8));

    expect(authorLinks(container)).toEqual([
      '/authors/Yoto',
      '/authors/%40alice',
      '/authors/%40bob',
    ]);
  });

  it('affiche l’initiale de l’auteur et marque les alias « @ »', () => {
    const { container } = renderPage(summaryWith({ '@alice': 2, Yoto: 1 }, 3));

    const cards = [...container.querySelectorAll('.author-card')];
    const alice = cards.find(
      (c) => c.querySelector('a')?.getAttribute('href') === '/authors/%40alice'
    );
    const yoto = cards.find((c) => c.querySelector('a')?.getAttribute('href') === '/authors/Yoto');

    expect(alice?.querySelector('.author-avatar')?.textContent).toBe('@');
    expect(alice?.querySelector('.author-avatar')?.classList.contains('author-avatar--at')).toBe(
      true
    );
    expect(yoto?.querySelector('.author-avatar')?.textContent).toBe('Y');
    expect(yoto?.querySelector('.author-avatar')?.classList.contains('author-avatar--at')).toBe(
      false
    );
  });

  it('affiche le nombre d’icônes (pluriel correct)', () => {
    const { container } = renderPage(summaryWith({ '@alice': 2, Yoto: 1 }, 3));

    const cards = [...container.querySelectorAll('.author-card')];
    const alice = cards.find(
      (c) => c.querySelector('a')?.getAttribute('href') === '/authors/%40alice'
    );
    const yoto = cards.find((c) => c.querySelector('a')?.getAttribute('href') === '/authors/Yoto');

    expect(alice?.querySelector('.author-count')?.textContent?.trim()).toBe('2 icônes');
    expect(yoto?.querySelector('.author-count')?.textContent?.trim()).toBe('1 icône');
  });

  it('marque l’auteur courant comme actif', () => {
    const { container } = renderPage(summaryWith({ '@alice': 2 }), '/authors/%40alice');

    const card = container.querySelector('.author-card');
    expect(card?.classList.contains('is-active')).toBe(true);
    expect(card?.querySelector('.author-link')).toHaveAttribute('aria-current', 'page');
  });

  it('affiche un message quand aucun auteur n’est disponible', () => {
    const { container } = renderPage(summaryWith({}));

    expect(container.querySelectorAll('.author-card')).toHaveLength(0);
    expect(screen.getByText('Aucun auteur disponible pour le moment.')).toBeInTheDocument();
  });
});
