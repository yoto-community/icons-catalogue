import { useEffect } from 'react';
import type { Icon } from '../types';

interface UseKeyboardShortcutsProps {
  selectedIcon: Icon | null;
  closeIconDetail: () => void;
  searchInputId?: string;
}

/**
 * Raccourcis clavier globaux :
 * - `/` : focus sur la barre de recherche (hors champ actif).
 * - `Échap` : ferme le modal de détail s'il est ouvert, sinon blurre la recherche.
 *
 * Note : volontairement aucune dépendance volatile (query, etc.) afin que
 * l'écouteur ne soit pas réabonné à chaque frappe de caractère.
 */
export function useKeyboardShortcuts({
  selectedIcon,
  closeIconDetail,
  searchInputId = 'search-input',
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target instanceof HTMLElement ? e.target : null;
      const isInput =
        (target !== null &&
          (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) ||
        false;

      if (e.key === '/' && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const input = document.getElementById(searchInputId);
        if (input instanceof HTMLInputElement) {
          input.focus();
          input.select();
        }
      }
      if (e.key === 'Escape') {
        const input = document.getElementById(searchInputId);
        if (selectedIcon) {
          closeIconDetail();
        } else if (input instanceof HTMLInputElement) {
          input.blur();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIcon, closeIconDetail, searchInputId]);
}
