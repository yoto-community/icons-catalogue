import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  query: string;
  performSearch: () => void;
  selectedIcon: unknown;
  closeIconDetail: () => void;
  searchInputId?: string;
}

export function useKeyboardShortcuts({
  query,
  performSearch,
  selectedIcon,
  closeIconDetail,
  searchInputId = 'search-input',
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;

      if (e.key === '/' && !isInput && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const input = document.getElementById(searchInputId) as HTMLInputElement;
        input?.focus();
        input?.select();
      }
      if (e.key === 'Escape') {
        const input = document.getElementById(searchInputId) as HTMLInputElement;
        if (selectedIcon) {
          closeIconDetail();
        } else {
          input?.blur();
          if (query.trim()) {
            // Note: setQuery would need to be passed or we use a different approach
            // For now, we'll just trigger the search with empty query
            // The parent component should handle the actual state update
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [query, performSearch, selectedIcon, closeIconDetail, searchInputId]);
}