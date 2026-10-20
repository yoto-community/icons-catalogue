import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  useRef,
} from 'react';
import { onWindowCustomEvent, emitWindowCustomEvent } from '../utils/windowEvents';

const FAV_KEY = 'yoto-icons-favorites';

interface FavoritesContextType {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => boolean;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);
  // Ref to track if the change originated from this tab (to avoid circular updates)
  const isLocalChange = useRef(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setFavorites(new Set(parsed.filter((s): s is string => typeof s === 'string')));
        }
      }
    } catch {
      // Ignore parse errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever favorites change (from this tab)
  useEffect(() => {
    if (isLoaded && isLocalChange.current) {
      localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
      // Dispatch custom event for cross-tab sync
      emitWindowCustomEvent<{ favorites: string[] }>('yoto-favorites-change', {
        favorites: [...favorites],
      });
    }
    // Reset flag after the effect runs
    isLocalChange.current = false;
  }, [favorites, isLoaded]);

  // Listen for cross-tab changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FAV_KEY && e.newValue !== e.oldValue) {
        try {
          const raw = localStorage.getItem(FAV_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              isLocalChange.current = false;
              setFavorites(new Set(parsed.filter((s): s is string => typeof s === 'string')));
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent<{ favorites: string[] }>) => {
      // Only update if this didn't originate from this tab
      if (!isLocalChange.current) {
        setFavorites(new Set(e.detail.favorites));
      }
    };

    window.addEventListener('storage', handleStorage);
    const unsubscribeCustomEvent = onWindowCustomEvent<{ favorites: string[] }>(
      'yoto-favorites-change',
      handleCustomEvent
    );

    return () => {
      window.removeEventListener('storage', handleStorage);
      unsubscribeCustomEvent();
    };
  }, []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const toggleFavorite = useCallback(
    (id: string): boolean => {
      isLocalChange.current = true;
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          return next;
        }
        next.add(id);
        return next;
      });
      return !favorites.has(id);
    },
    [favorites]
  );

  const addFavorite = useCallback((id: string) => {
    isLocalChange.current = true;
    setFavorites((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    isLocalChange.current = true;
    setFavorites((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => {
    isLocalChange.current = true;
    setFavorites(new Set());
  }, []);

  const value: FavoritesContextType = {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
