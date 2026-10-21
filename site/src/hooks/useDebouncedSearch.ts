import { useCallback, useRef, useEffect } from 'react';
import { DEBOUNCE_MS } from '../constants';

interface UseDebouncedSearchProps {
  onSearch: () => void;
  onUrlSync?: () => void;
  urlSyncDelay?: number;
}

export function useDebouncedSearch({
  onSearch,
  onUrlSync,
  urlSyncDelay = 100,
}: UseDebouncedSearchProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const urlSyncRef = useRef<ReturnType<typeof setTimeout>>();

  const performSearch = useCallback(() => {
    onSearch();
    // URL sync debounced
    if (urlSyncRef.current) clearTimeout(urlSyncRef.current);
    if (onUrlSync) {
      urlSyncRef.current = setTimeout(onUrlSync, urlSyncDelay);
    }
  }, [onSearch, onUrlSync, urlSyncDelay]);

  const handleQueryChange = useCallback(
    (value: string, setQuery: React.Dispatch<React.SetStateAction<string>>) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(performSearch, DEBOUNCE_MS);
    },
    [performSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (urlSyncRef.current) clearTimeout(urlSyncRef.current);
    };
  }, []);

  return { performSearch, handleQueryChange };
}
