import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Icon, SummaryData } from '../types';
import { apiClient } from '../api/client';
import { planSourceOrder } from '../api/manifest';
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
  /**
   * Vrai quand **tous** les shards sont chargés. Tant que c'est faux, la grille
   * affiche les icônes déjà reçues et l'UI signale le chargement d'arrière-plan.
   */
  isComplete: boolean;
  /**
   * Message d'erreur du dernier chargement du catalogue (`null` si OK).
   * L'UI l'utilise pour afficher un état d'échec explicite + un bouton Réessayer,
   * au lieu de confondre une panne de chargement avec un catalogue vide.
   */
  error: string | null;
  /** Relance le chargement du catalogue (après un échec). */
  reload: () => void;
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
 * par chaque page, ce qui reconstruisait l'index Lunr (~1,1 s) plusieurs fois.
 * Le Contexte supprime cette duplication et le Web Worker supprime le blocage
 * du main thread.
 */
export function IconsDataProvider({ children }: { children: ReactNode }) {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isSearchReady, setIsSearchReady] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Incrémenté par `reload()` pour relancer l'effet de chargement.
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  // Moteur de recherche unique, construit **une seule fois** quand tous les
  // shards sont chargés (sinon il serait reconstruit à chaque fusion).
  const searchEngine = useMemo(
    () => (isComplete && icons.length > 0 ? createSearchEngine(icons) : null),
    [isComplete, icons]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        setIsComplete(false);
        setIsSearchReady(false);
        setError(null);
        setIcons([]);

        const manifest = await apiClient.getManifest();
        const order = planSourceOrder(manifest.sources);

        // Résumé : non bloquant, échec toléré.
        apiClient
          .getSummary()
          .then((data) => {
            if (!cancelled) setSummary(data);
          })
          .catch((err) => {
            console.warn('[IconsDataProvider] Failed to load summary:', err);
          });

        for (const source of order) {
          if (cancelled) return;
          const shard = await apiClient.getSourceShard(source);
          if (cancelled) return;
          setIcons((prev) => [...prev, ...shard]);
          // Dès le premier shard, la grille peut s'afficher.
          setIsLoading(false);
        }

        if (cancelled) return;
        setIsComplete(true);
      } catch (err) {
        console.error('[IconsDataProvider] Erreur chargement catalogue :', err);
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

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

  // Valeur du contexte mémoïsée : sans cela, chaque rendu du provider créait
  // un nouvel objet, re-rendant tous les consommateurs inutilement.
  const value = useMemo<IconsDataContextValue>(
    () => ({
      icons,
      searchEngine,
      isLoading,
      isSearchReady,
      isComplete,
      error,
      reload,
      categories,
      subcategories,
      subcategoriesByCategory,
      summary,
    }),
    [
      icons,
      searchEngine,
      isLoading,
      isSearchReady,
      isComplete,
      error,
      reload,
      categories,
      subcategories,
      subcategoriesByCategory,
      summary,
    ]
  );

  return <IconsDataContext.Provider value={value}>{children}</IconsDataContext.Provider>;
}

export function useIconsData(): IconsDataContextValue {
  const context = useContext(IconsDataContext);
  if (!context) {
    throw new Error('useIconsData must be used within an IconsDataProvider');
  }
  return context;
}
