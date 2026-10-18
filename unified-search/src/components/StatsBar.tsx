import type { SummaryData } from '../types';

interface StatsBarProps {
  totalFiltered: number;
  query: string;
  category: string;
  subcategory: string;
  summary?: SummaryData;
}

export function StatsBar({ totalFiltered, query, category, subcategory, summary }: StatsBarProps) {
  return (
    <div className="stats-bar">
      <span className="stats-total">
        {totalFiltered.toLocaleString('fr-FR')} icône{totalFiltered > 1 ? 's' : ''}
        {query && <span className="stats-query"> pour « {query} »</span>}
        {category && <span className="stats-filter"> · Catégorie: {category}</span>}
        {subcategory && <span className="stats-filter"> · {subcategory}</span>}
      </span>
      {summary?.bySource && (
        <span className="stats-sources">
          {summary.bySource.yotopixels ?? 0} yotopixels +{' '}
          {summary.bySource.yotoicons ?? 0} yotoicons +{' '}
          {summary.bySource['yoto-official'] ?? 0} yoto-officiel
        </span>
      )}
    </div>
  );
}