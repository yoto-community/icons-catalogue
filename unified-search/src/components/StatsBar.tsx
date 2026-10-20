import type { SummaryData } from '../types';
import { useI18n } from '../i18n';

interface StatsBarProps {
  totalFiltered: number;
  query: string;
  category: string;
  subcategory: string;
  summary?: SummaryData;
}

export function StatsBar({ totalFiltered, query, category, subcategory, summary }: StatsBarProps) {
  const { t } = useI18n();

  return (
    <div className="stats-bar">
      <span className="stats-total">
        {t('stats.iconsCount', { count: totalFiltered })}
        {query && <span className="stats-query">{t('stats.queryPrefix', { query })}</span>}
        {category && (
          <span className="stats-filter">{t('stats.categoryPrefix', { category })}</span>
        )}
        {subcategory && (
          <span className="stats-filter">{t('stats.subcategoryPrefix', { subcategory })}</span>
        )}
      </span>
      {summary?.counts?.bySource && (
        <span className="stats-sources">
          {t('stats.sources', {
            yotopixels: summary.counts.bySource.yotopixels ?? 0,
            yotoicons: summary.counts.bySource.yotoicons ?? 0,
            yotoOfficial: summary.counts.bySource['yoto-official'] ?? 0,
          })}
        </span>
      )}
    </div>
  );
}
