import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nProvider } from '../i18n';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { Pagination } from './Pagination';
import { StatsBar } from './StatsBar';
import type { SummaryData } from '../types';

function renderWithI18n(ui: ReactNode) {
  return render(<I18nProvider defaultLocale="fr">{ui}</I18nProvider>);
}

const summary: SummaryData = {
  schemaVersion: 1,
  catalogVersion: '2024.01.01-1',
  updatedAt: '2024-01-01T00:00:00.000Z',
  total: 30,
  counts: {
    bySource: { yotopixels: 10, yotoicons: 15, 'yoto-official': 5 },
    byCategory: {},
    byArtist: {},
    bySubcategory: {},
    topTags: {},
    topArtists: {},
  },
};

describe('EmptyState', () => {
  it('affiche la requête recherchée', () => {
    renderWithI18n(<EmptyState query="licorne" hasActiveFilters={false} onReset={() => {}} />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByText(/licorne/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('affiche le message sans requête et propose la réinitialisation', () => {
    const onReset = vi.fn();
    renderWithI18n(<EmptyState query="" hasActiveFilters onReset={onReset} />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    button.click();
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('est masqué pendant le chargement', () => {
    const { container } = renderWithI18n(
      <EmptyState query="" hasActiveFilters={false} onReset={() => {}} isLoading />
    );
    expect(container.querySelector('.empty-state')).toHaveAttribute('hidden');
  });
});

describe('LoadingState', () => {
  it('affiche le message de chargement et l’indice de première visite', () => {
    const { container } = renderWithI18n(<LoadingState />);
    expect(container.querySelector('.spinner')).not.toBeNull();
    expect(container.querySelectorAll('p')).toHaveLength(2);
  });
});

describe('Pagination', () => {
  it('ne rend rien avec une seule page', () => {
    const { container } = renderWithI18n(
      <Pagination
        currentPage={1}
        totalPages={1}
        shownCount={0}
        totalCount={0}
        onPageChange={() => {}}
        onLoadMore={() => {}}
      />
    );
    expect(container.querySelector('.pagination')).toBeNull();
  });

  it('désactive « précédent » en première page et charge la suite', () => {
    const onLoadMore = vi.fn();
    const onPageChange = vi.fn();
    const { container } = renderWithI18n(
      <Pagination
        currentPage={1}
        totalPages={3}
        shownCount={48}
        totalCount={100}
        onPageChange={onPageChange}
        onLoadMore={onLoadMore}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeDisabled(); // précédent
    expect(buttons[1]).toBeEnabled(); // charger plus
    // Locale-agnostique : « 48 sur 100 icônes » (fr) / « 48 of 100 icons » (en).
    expect(container.querySelector('.pagination-info')).toHaveTextContent(/48.*100/);

    buttons[1].click();
    expect(onLoadMore).toHaveBeenCalledTimes(1);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('désactive « charger plus » en dernière page et navigue vers la précédente', () => {
    const onLoadMore = vi.fn();
    const onPageChange = vi.fn();
    renderWithI18n(
      <Pagination
        currentPage={3}
        totalPages={3}
        shownCount={100}
        totalCount={100}
        onPageChange={onPageChange}
        onLoadMore={onLoadMore}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toBeEnabled();
    expect(buttons[1]).toBeDisabled();

    buttons[0].click();
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe('StatsBar', () => {
  it('affiche le nombre filtré et les préfixes de filtre', () => {
    renderWithI18n(
      <StatsBar totalFiltered={12} query="étoile" category="Nature" subcategory="Ciel" />
    );
    expect(screen.getByText(/12/)).toBeInTheDocument();
    expect(screen.getByText(/étoile/)).toBeInTheDocument();
    expect(screen.getByText(/Nature/)).toBeInTheDocument();
    expect(screen.getByText(/Ciel/)).toBeInTheDocument();
  });

  it('affiche la répartition par source quand le résumé est fourni', () => {
    const { container } = renderWithI18n(
      <StatsBar totalFiltered={30} query="" category="" subcategory="" summary={summary} />
    );
    const sources = container.querySelector('.stats-sources');
    expect(sources).not.toBeNull();
    expect(sources?.textContent).toContain('10');
    expect(sources?.textContent).toContain('15');
    expect(sources?.textContent).toContain('5');
  });

  it("n'affiche pas la répartition sans résumé", () => {
    const { container } = renderWithI18n(
      <StatsBar totalFiltered={0} query="" category="" subcategory="" />
    );
    expect(container.querySelector('.stats-sources')).toBeNull();
  });
});
