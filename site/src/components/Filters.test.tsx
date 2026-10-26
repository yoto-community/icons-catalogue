import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { Filters, SourceFilter } from './Filters';
import type { SortOption } from '../types';

function renderWithI18n(ui: React.ReactNode) {
  return render(<I18nProvider defaultLocale="fr">{ui}</I18nProvider>);
}

describe('SourceFilter', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  it('propose « toutes » puis les trois sources', () => {
    renderWithI18n(<SourceFilter value="" onChange={() => {}} />);
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.getAttribute('value'))).toEqual([
      '',
      'yotopixels',
      'yotoicons',
      'yoto-official',
    ]);
    expect(options[0]).toHaveTextContent(/toutes/i);
  });

  it('notifie la source choisie', () => {
    const onChange = vi.fn();
    renderWithI18n(<SourceFilter value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/source/i), { target: { value: 'yotoicons' } });
    expect(onChange).toHaveBeenCalledWith('yotoicons');
  });
});

describe('Filters', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  const baseProps = {
    category: '',
    subcategory: '',
    source: '',
    sortBy: 'downloads' as SortOption,
    categories: ['nature'],
    subcategories: [],
    hasActiveFilters: false,
    onCategoryChange: () => {},
    onSubcategoryChange: () => {},
    onSourceChange: () => {},
    onSortChange: () => {},
    onReset: () => {},
  };

  it('transmet la source sélectionnée', () => {
    const onSourceChange = vi.fn();
    renderWithI18n(<Filters {...baseProps} onSourceChange={onSourceChange} />);

    fireEvent.change(screen.getByLabelText(/source/i), { target: { value: 'yotopixels' } });

    expect(onSourceChange).toHaveBeenCalledWith('yotopixels');
  });

  it('n’expose plus de filtre par provenance (doublon du filtre source)', () => {
    renderWithI18n(<Filters {...baseProps} />);
    expect(screen.queryByLabelText(/provenance/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/licence/i)).not.toBeInTheDocument();
  });

  it('affiche le filtre source même quand la catégorie est imposée', () => {
    renderWithI18n(<Filters {...baseProps} hideCategoryFilter />);
    expect(screen.getByLabelText(/source/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/catégorie/i)).not.toBeInTheDocument();
  });

  it('ne propose plus le tri par date (date de collecte, non représentative)', () => {
    renderWithI18n(<Filters {...baseProps} />);
    const sort = screen.getByLabelText(/trier/i) as HTMLSelectElement;
    expect([...sort.options].map((o) => o.value)).toEqual(['downloads', 'title']);
  });
});
