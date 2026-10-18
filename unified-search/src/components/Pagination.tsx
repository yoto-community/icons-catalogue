import { useI18n } from '../i18n';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
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
      <span className="pagination-info" aria-current="page">
        {t('pagination.pageInfo', { current: currentPage, total: totalPages })}
      </span>
      <button
        className="btn btn-page"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label={t('pagination.nextAria')}
      >
        {t('pagination.next')}
      </button>
    </nav>
  );
}