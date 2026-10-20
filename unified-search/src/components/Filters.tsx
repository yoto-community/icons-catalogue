import type { ChangeEvent } from 'react';
import type { SortOption, SummaryData } from '../types';
import { useI18n } from '../i18n';
import { toSortOption } from '../utils/urlParams';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  summary?: SummaryData;
}

export function CategoryFilter({ value, onChange, categories, summary }: CategoryFilterProps) {
  const { t } = useI18n();

  return (
    <div className="filter-group">
      <label htmlFor="category-filter" className="sr-only">
        {t('filters.categoryLabel')}
      </label>
      <select
        id="category-filter"
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        aria-label={t('filters.categoryAria')}
      >
        <option value="">{t('filters.allCategories')}</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
            {summary?.counts?.byCategory?.[cat] && ` (${summary.counts.byCategory[cat]})`}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SubcategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  subcategories: string[];
}

export function SubcategoryFilter({ value, onChange, subcategories }: SubcategoryFilterProps) {
  const { t } = useI18n();

  if (subcategories.length === 0) return null;

  return (
    <div className="filter-group">
      <label htmlFor="subcategory-filter" className="sr-only">
        {t('filters.subcategoryLabel')}
      </label>
      <select
        id="subcategory-filter"
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        aria-label={t('filters.subcategoryAria')}
      >
        <option value="">{t('filters.allSubcategories')}</option>
        {subcategories.map((subcat) => (
          <option key={subcat} value={subcat}>
            {subcat.charAt(0).toUpperCase() + subcat.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

interface SortFilterProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export function SortFilter({ value, onChange }: SortFilterProps) {
  const { t } = useI18n();

  return (
    <div className="filter-group">
      <label htmlFor="sort-filter" className="sr-only">
        {t('filters.sortLabel')}
      </label>
      <select
        id="sort-filter"
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(toSortOption(e.target.value))}
        aria-label={t('filters.sortAria')}
      >
        <option value="downloads">{t('common.downloadsDesc')}</option>
        <option value="title">{t('common.titleAZ')}</option>
        <option value="date">{t('common.newest')}</option>
      </select>
    </div>
  );
}

interface ResetFiltersProps {
  hasActiveFilters: boolean;
  onClick: () => void;
}

export function ResetFilters({ hasActiveFilters, onClick }: ResetFiltersProps) {
  const { t } = useI18n();

  if (!hasActiveFilters) return null;

  return (
    <button
      type="button"
      className="btn btn-reset"
      onClick={onClick}
      aria-label={t('filters.resetAria')}
    >
      {t('filters.resetLabel')}
    </button>
  );
}

interface FiltersProps {
  category: string;
  subcategory: string;
  sortBy: SortOption;
  categories: string[];
  subcategories: string[];
  summary?: SummaryData;
  hasActiveFilters: boolean;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onReset: () => void;
  hideCategoryFilter?: boolean;
}

export function Filters({
  category,
  subcategory,
  sortBy,
  categories,
  subcategories,
  summary,
  hasActiveFilters,
  onCategoryChange,
  onSubcategoryChange,
  onSortChange,
  onReset,
  hideCategoryFilter = false,
}: FiltersProps) {
  return (
    <section className="filters-section" aria-labelledby="filters-title">
      <div className="filters">
        {!hideCategoryFilter && (
          <CategoryFilter
            value={category}
            onChange={onCategoryChange}
            categories={categories}
            summary={summary ?? undefined}
          />
        )}
        <SubcategoryFilter
          value={subcategory}
          onChange={onSubcategoryChange}
          subcategories={subcategories}
        />
        <SortFilter value={sortBy} onChange={onSortChange} />
        <ResetFilters hasActiveFilters={hasActiveFilters} onClick={onReset} />
      </div>
    </section>
  );
}
