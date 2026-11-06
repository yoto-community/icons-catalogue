import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  TOOLKIT_KEY,
  readIconFavorites,
  readToolkitWithLegacy,
  syncIconFavorites,
} from '../lib/sharedStorage';

const FAV_KEY = 'yoto-icons-favorites';

interface FavoritesContextType {
  favorites: Set<string>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string, title?: string) => boolean;
  addFavorite: (id: string, title?: string) => void;
  removeFavorite: (id: string) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  // Titres connus par le catalogue : ils sont recopiés dans la trousse pour
  // que le portail affiche « Moon » plutôt que l'identifiant opaque.
  const titlesRef = useRef<Record<string, string>>({});

  // Lecture SYNCHRONE au montage (initialiseur paresseux) : l'état initial vaut
  // déjà les favoris stockés, ce qui supprime le rendu en cascade d'un effet de
  // chargement et le risque d'écraser le stockage avec un état vide.
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set(readIconFavorites()));

  // Persiste à chaque changement : l'ancienne clé reste la source du catalogue,
  // la trousse partagée reçoit la même liste avec les titres connus.
  useEffect(() => {
    try {
      localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
    } catch {
      /* stockage indisponible : la trousse tentera elle aussi sans casser la page */
    }
    syncIconFavorites(favorites, titlesRef.current);
  }, [favorites]);

  // Synchronisation inter-onglets : `storage` ne se déclenche que dans les
  // AUTRES onglets, il n'y a donc pas de boucle à éviter côté émetteur.
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TOOLKIT_KEY) {
        // La trousse est la source de vérité dès qu'elle existe : un retrait
        // fait depuis le portail doit aussi retirer le favori ici.
        setFavorites(
          new Set(
            readToolkitWithLegacy()
              .items.filter((item) => item.type === 'icon')
              .map((item) => item.id)
          )
        );
      } else if (e.key === FAV_KEY && e.newValue !== e.oldValue) {
        setFavorites(new Set(readIconFavorites()));
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites]);

  const toggleFavorite = useCallback(
    (id: string, title?: string): boolean => {
      if (title) titlesRef.current[id] = title;
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

  const addFavorite = useCallback((id: string, title?: string) => {
    if (title) titlesRef.current[id] = title;
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
    titlesRef.current = {};
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
