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
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Update totalPages and totalFiltered when filteredIcons changes
  useEffect(() => {
    const total = filteredIcons.length;
    setTotalFiltered(total);
    setTotalPages(Math.max(1, Math.ceil(total / ICONS_PER_PAGE)));
  }, [filteredIcons]);

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