import { useState, useEffect } from 'react';
import lunr from 'lunr';
import type { Icon, SummaryData } from '../types';
import { INDEX_URL } from '../constants';
import { apiClient } from '../api/client';

interface UseIconsDataReturn {
  icons: Icon[];
  index: lunr.Index | null;
  isIndexLoaded: boolean;
  isLoading: boolean;
  categories: string[];
  subcategories: string[];
  subcategoriesByCategory: Record<string, string[]>;
  summary: SummaryData | null;
}

export function useIconsData(): UseIconsDataReturn {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [index, setIndex] = useState<lunr.Index | null>(null);
  const [isIndexLoaded, setIsIndexLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<Record<string, string[]>>({});
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // Charger les icônes
        const iconsResponse = await fetch(INDEX_URL);
        const iconsData = (await iconsResponse.json()) as Icon[];
        setIcons(iconsData);

        // Construire l'index Lunr
        const idx = lunr(function () {
          this.ref('id');
          this.field('tags', { boost: 10 });
          this.field('artist');
          this.field('title');
          this.field('category');
          this.field('subcategory');

          iconsData.forEach(icon => {
            this.add({
              id: icon.id,
              tags: icon.tags,
              artist: icon.artist,
              title: icon.title,
              category: icon.category,
              subcategory: icon.subcategory,
            });
          });
        });
        setIndex(idx);
        setIsIndexLoaded(true);

        // Extraire les catégories et sous-catégories uniques
        const cats = [...new Set(iconsData.map(i => i.category))].sort();
        const subcats = [...new Set(iconsData.map(i => i.subcategory).filter(Boolean))].sort();
        setCategories(cats);
        setSubcategories(subcats);

        // Construire le mapping catégorie -> sous-catégories
        const catToSubcats: Record<string, string[]> = {};
        iconsData.forEach(icon => {
          if (icon.subcategory) {
            if (!catToSubcats[icon.category]) {
              catToSubcats[icon.category] = [];
            }
            if (!catToSubcats[icon.category].includes(icon.subcategory)) {
              catToSubcats[icon.category].push(icon.subcategory);
            }
          }
        });
        // Trier les sous-catégories pour chaque catégorie
        Object.keys(catToSubcats).forEach(cat => {
          catToSubcats[cat].sort();
        });
        setSubcategoriesByCategory(catToSubcats);

        // Charger le résumé
        try {
          const summaryData = await apiClient.getSummary();
          setSummary(summaryData);
          
        } catch (err) {
          console.warn('[useIconsData] Failed to load summary:', err);
        }

        
      } catch (err) {
        console.error('Erreur chargement index :', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return {
    icons,
    index,
    isIndexLoaded,
    isLoading,
    categories,
    subcategories,
    subcategoriesByCategory,
    summary,
  };
}