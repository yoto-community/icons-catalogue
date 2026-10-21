import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { Filters, SourceFilter, LicenseFilter } from './Filters';
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

describe('LicenseFilter', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  it('propose « toutes » puis les trois licences', () => {
    renderWithI18n(<LicenseFilter value="" onChange={() => {}} />);
    const options = screen.getAllByRole('option');
    expect(options.map((o) => o.getAttribute('value'))).toEqual([
      '',
      'CC-BY-SA',
      'CC-BY-NC',
      'Yoto Official',
    ]);
  });

  it('notifie la licence choisie', () => {
    const onChange = vi.fn();
    renderWithI18n(<LicenseFilter value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/licence/i), { target: { value: 'CC-BY-NC' } });
    expect(onChange).toHaveBeenCalledWith('CC-BY-NC');
  });
});

describe('Filters', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  const baseProps = {
    category: '',
    subcategory: '',
    source: '',
    license: '',
    sortBy: 'downloads' as SortOption,
    categories: ['nature'],
    subcategories: [],
    hasActiveFilters: false,
    onCategoryChange: () => {},
    onSubcategoryChange: () => {},
    onSourceChange: () => {},
    onLicenseChange: () => {},
    onSortChange: () => {},
    onReset: () => {},
  };

  it('transmet la source et la licence sélectionnées', () => {
    const onSourceChange = vi.fn();
    const onLicenseChange = vi.fn();
    renderWithI18n(
      <Filters {...baseProps} onSourceChange={onSourceChange} onLicenseChange={onLicenseChange} />
    );

    fireEvent.change(screen.getByLabelText(/source/i), { target: { value: 'yotopixels' } });
    fireEvent.change(screen.getByLabelText(/licence/i), { target: { value: 'CC-BY-SA' } });

    expect(onSourceChange).toHaveBeenCalledWith('yotopixels');
    expect(onLicenseChange).toHaveBeenCalledWith('CC-BY-SA');
  });

  it('affiche les filtres source/licence même quand la catégorie est imposée', () => {
    renderWithI18n(<Filters {...baseProps} hideCategoryFilter />);
    expect(screen.getByLabelText(/source/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/licence/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/catégorie/i)).not.toBeInTheDocument();
  });

  it('ne propose plus le tri par date (date de collecte, non représentative)', () => {
    renderWithI18n(<Filters {...baseProps} />);
    const sort = screen.getByLabelText(/trier/i) as HTMLSelectElement;
    expect([...sort.options].map((o) => o.value)).toEqual(['downloads', 'title']);
  });
});
