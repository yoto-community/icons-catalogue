import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Icon, SummaryData } from '../types';
import { assertIconArray } from '../types/guards';
import { INDEX_URL } from '../constants';
import { apiClient } from '../api/client';
import { createSearchEngine, type SearchEngine } from '../searchEngine';

interface IconsDataContextValue {
  icons: Icon[];
  /**
   * Moteur de recherche (index Lunr construit dans un Web Worker).
   * `null` tant que les icônes ne sont pas chargées.
   */
  searchEngine: SearchEngine | null;
  /** Vrai une fois les icônes chargées (l'index peut encore se construire en arrière-plan). */
  isLoading: boolean;
  isSearchReady: boolean;
  categories: string[];
  subcategories: string[];
  subcategoriesByCategory: Record<string, string[]>;
  summary: SummaryData | null;
}

const IconsDataContext = createContext<IconsDataContextValue | null>(null);

/**
 * Charge les icônes UNE SEULE fois pour toute l'application et instancie le
 * moteur de recherche partagé.
 *
 * Point de performance : `useIconsData` était appelé à la fois par `App` et
 * par chaque page, ce qui reconstruisait l'index Lunr (~1,5 s) plusieurs fois.
 * Le Contexte supprime cette duplication et le Web Worker supprime le blocage
 * du main thread.
 */
export function IconsDataProvider({ children }: { children: ReactNode }) {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchReady, setIsSearchReady] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  // Moteur de recherche unique, mémoïsé : recréé uniquement si les icônes changent.
  // Aucun worker tant que les données ne sont pas chargées (évite un worker vide).
  const searchEngine = useMemo(
    () => (icons.length > 0 ? createSearchEngine(icons) : null),
    [icons]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);

        const iconsResponse = await fetch(INDEX_URL);
        const payload: unknown = await iconsResponse.json();
        assertIconArray(payload);

        if (cancelled) return;
        setIcons(payload);

        // Chargement du résumé : non bloquant, échec toléré.
        try {
          const summaryData = await apiClient.getSummary();
          if (!cancelled) setSummary(summaryData);
        } catch (err) {
          console.warn('[IconsDataProvider] Failed to load summary:', err);
        }
      } catch (err) {
        console.error('[IconsDataProvider] Erreur chargement index :', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Signale l'exploitation de l'index dès que le moteur (worker) est prêt.
  useEffect(() => {
    if (!searchEngine) return;
    let cancelled = false;
    searchEngine.ready.then(() => {
      if (!cancelled) setIsSearchReady(true);
    });
    return () => {
      cancelled = true;
      searchEngine.dispose();
    };
  }, [searchEngine]);

  const { categories, subcategories, subcategoriesByCategory } = useMemo(() => {
    const cats = [...new Set(icons.map((i) => i.category))].sort();
    const subcats = [...new Set(icons.map((i) => i.subcategory).filter(Boolean))].sort();

    const mapping: Record<string, string[]> = {};
    for (const icon of icons) {
      if (!icon.subcategory) continue;
      const list = (mapping[icon.category] ??= []);
      if (!list.includes(icon.subcategory)) list.push(icon.subcategory);
    }
    for (const cat of Object.keys(mapping)) mapping[cat].sort();

    return { categories: cats, subcategories: subcats, subcategoriesByCategory: mapping };
  }, [icons]);

  const value: IconsDataContextValue = {
    icons,
    searchEngine,
    isLoading,
    isSearchReady,
    categories,
    subcategories,
    subcategoriesByCategory,
    summary,
  };

  return <IconsDataContext.Provider value={value}>{children}</IconsDataContext.Provider>;
}

export function useIconsData(): IconsDataContextValue {
  const context = useContext(IconsDataContext);
  if (!context) {
    throw new Error('useIconsData must be used within an IconsDataProvider');
  }
  return context;
}
