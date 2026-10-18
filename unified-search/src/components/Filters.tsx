import type { ChangeEvent } from 'react';
import type { SortOption, SummaryData } from '../types';

interface CategoryFilterProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  summary?: SummaryData;
}

export function CategoryFilter({ value, onChange, categories, summary }: CategoryFilterProps) {
  return (
    <div className="filter-group">
      <label htmlFor="category-filter" className="sr-only">Catégorie</label>
      <select
        id="category-filter"
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        aria-label="Filtrer par catégorie"
      >
        <option value="">Toutes les catégories</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
            {summary?.byCategory[cat] && ` (${summary.byCategory[cat]})`}
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
  if (subcategories.length === 0) return null;

  return (
    <div className="filter-group">
      <label htmlFor="subcategory-filter" className="sr-only">Sous-catégorie</label>
      <select
        id="subcategory-filter"
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        aria-label="Filtrer par sous-catégorie"
      >
        <option value="">Toutes les sous-catégories</option>
        {subcategories.map(subcat => (
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
  return (
    <div className="filter-group">
      <label htmlFor="sort-filter" className="sr-only">Trier par</label>
      <select
        id="sort-filter"
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value as SortOption)}
        aria-label="Trier les résultats"
      >
        <option value="downloads">Téléchargements (desc)</option>
        <option value="title">Titre (A-Z)</option>
        <option value="date">Plus récentes</option>
      </select>
    </div>
  );
}

interface ResetFiltersProps {
  hasActiveFilters: boolean;
  onClick: () => void;
}

export function ResetFilters({ hasActiveFilters, onClick }: ResetFiltersProps) {
  if (!hasActiveFilters) return null;

  return (
    <button
      type="button"
      className="btn btn-reset"
      onClick={onClick}
      aria-label="Réinitialiser tous les filtres"
    >
      Réinitialiser
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
}: FiltersProps) {
  return (
    <section className="filters-section" aria-labelledby="filters-title">
      <div className="filters">
        <CategoryFilter
          value={category}
          onChange={onCategoryChange}
          categories={categories}
          summary={summary ?? undefined}
        />
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