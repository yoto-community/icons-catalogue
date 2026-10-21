import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

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

/** Extrait la liste d'ids valide d'une valeur brute de localStorage. */
function parseFavorites(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    // Stockage corrompu : on ignore plutôt que de planter l'application.
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Charge les favoris depuis localStorage au montage.
  useEffect(() => {
    setFavorites(new Set(parseFavorites(localStorage.getItem(FAV_KEY))));
    setIsLoaded(true);
  }, []);

  // Persiste à chaque changement. Le premier enregistrement n'a lieu qu'après
  // le chargement initial, pour ne pas écraser le stockage avec un état vide.
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
    }
  }, [favorites, isLoaded]);

  // Synchronisation inter-onglets : `storage` ne se déclenche que dans les
  // AUTRES onglets, il n'y a donc pas de boucle à éviter côté émetteur.
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === FAV_KEY && e.newValue !== e.oldValue) {
        setFavorites(new Set(parseFavorites(localStorage.getItem(FAV_KEY))));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const toggleFavorite = useCallback(
    (id: string): boolean => {
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
    setFavorites((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clearFavorites = useCallback(() => {
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
