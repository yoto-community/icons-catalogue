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
  /** Accumule la page suivante sans remonter la fenêtre (bouton « Charger plus »). */
  loadMore: () => void;
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

  // Modèle « accumulation » : au lieu de remplacer la page courante, la grille
  // conserve les icônes déjà affichées et en ajoute à chaque « Charger plus ».
  // `?page=N` reproduit donc les N×ICONS_PER_PAGE premières icônes.
  const paginatedIcons = useMemo(
    () => filteredIcons.slice(0, currentPage * ICONS_PER_PAGE),
    [filteredIcons, currentPage]
  );

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const loadMore = useCallback(() => {
    setCurrentPage((page) => Math.min(page + 1, totalPages));
  }, [totalPages]);

  return {
    paginatedIcons,
    currentPage,
    totalPages,
    totalFiltered,
    handlePageChange,
    loadMore,
    setCurrentPage,
  };
}
