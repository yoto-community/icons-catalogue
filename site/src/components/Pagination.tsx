import { useI18n } from '../i18n';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Nombre d'icônes actuellement affichées (accumulées). */
  shownCount: number;
  /** Nombre total d'icônes après filtres. */
  totalCount: number;
  onPageChange: (page: number) => void;
  /** Accumule la page suivante sans remonter la fenêtre. */
  onLoadMore: () => void;
}

export function Pagination({
  currentPage,
  totalPages,
  shownCount,
  totalCount,
  onPageChange,
  onLoadMore,
}: PaginationProps) {
  const { t } = useI18n();

  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label={t('common.search')}>
      <button
        className="btn btn-page"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label={t('pagination.previousAria')}
      >
        {t('pagination.previous')}
      </button>
      <span className="pagination-info" role="status">
        {t('pagination.shown', { shown: shownCount, total: totalCount })}
      </span>
      <button
        className="btn btn-page"
        onClick={onLoadMore}
        disabled={currentPage >= totalPages}
        aria-label={t('pagination.loadMoreAria')}
      >
        {t('pagination.loadMore')}
      </button>
    </nav>
  );
}
