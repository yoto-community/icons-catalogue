import { useMemo, useState, useCallback, useEffect } from 'react';
import { ICONS_PER_PAGE } from '../constants';

interface UsePaginationProps<T> {
  filteredIcons: T[];
  initialPage?: number;
}

interface UsePaginationReturn<T> {
  paginatedIcons: T[];
  currentPage: number;
  totalPages: number;
  totalFiltered: number;
  handlePageChange: (page: number) => void;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
}

export function usePagination<T>({
  filteredIcons,
  initialPage = 1,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Valeurs DÉRIVÉES (et non état + useEffect). La version précédente tenait
  // totalPages/totalFiltered dans un état initialisé à 1/0 : au premier rendu,
  // l'effet de reset lisait totalPages=1 et remettait immédiatement currentPage
  // à 1, ce qui rendait `initialPage > 1` inefficace au montage.
  const totalFiltered = filteredIcons.length;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalFiltered / ICONS_PER_PAGE)),
    [totalFiltered]
  );

  // Reset currentPage if it exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedIcons = useMemo(() => {
    const start = (currentPage - 1) * ICONS_PER_PAGE;
    return filteredIcons.slice(start, start + ICONS_PER_PAGE);
  }, [filteredIcons, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    paginatedIcons,
    currentPage,
    totalPages,
    totalFiltered,
    handlePageChange,
    setCurrentPage,
  };
}
