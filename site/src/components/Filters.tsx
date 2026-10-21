import type { ChangeEvent } from 'react';
import type { SortOption, SummaryData } from '../types';
import { useI18n } from '../i18n';
import { toSortOption } from '../utils/urlParams';
import { SOURCE_OPTIONS, LICENSE_OPTIONS, getSourceLabel } from '../constants/filters';

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

interface SourceFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function SourceFilter({ value, onChange }: SourceFilterProps) {
  const { t } = useI18n();

  return (
    <div className="filter-group">
      <label htmlFor="source-filter" className="sr-only">
        {t('filters.sourceLabel')}
      </label>
      <select
        id="source-filter"
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        aria-label={t('filters.sourceAria')}
      >
        <option value="">{t('filters.allSources')}</option>
        {SOURCE_OPTIONS.map((source) => (
          <option key={source} value={source}>
            {getSourceLabel(source, t)}
          </option>
        ))}
      </select>
    </div>
  );
}

interface LicenseFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function LicenseFilter({ value, onChange }: LicenseFilterProps) {
  const { t } = useI18n();

  return (
    <div className="filter-group">
      <label htmlFor="license-filter" className="sr-only">
        {t('filters.licenseLabel')}
      </label>
      <select
        id="license-filter"
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        aria-label={t('filters.licenseAria')}
      >
        <option value="">{t('filters.allLicenses')}</option>
        {LICENSE_OPTIONS.map((license) => (
          <option key={license} value={license}>
            {license}
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
  source: string;
  license: string;
  sortBy: SortOption;
  categories: string[];
  subcategories: string[];
  summary?: SummaryData;
  hasActiveFilters: boolean;
  onCategoryChange: (value: string) => void;
  onSubcategoryChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onLicenseChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onReset: () => void;
  hideCategoryFilter?: boolean;
}

export function Filters({
  category,
  subcategory,
  source,
  license,
  sortBy,
  categories,
  subcategories,
  summary,
  hasActiveFilters,
  onCategoryChange,
  onSubcategoryChange,
  onSourceChange,
  onLicenseChange,
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
        <SourceFilter value={source} onChange={onSourceChange} />
        <LicenseFilter value={license} onChange={onLicenseChange} />
        <SortFilter value={sortBy} onChange={onSortChange} />
        <ResetFilters hasActiveFilters={hasActiveFilters} onClick={onReset} />
      </div>
    </section>
  );
}
