import { useState, useEffect } from 'react';
import lunr from 'lunr';
import type { Icon, SummaryData } from '../types';
import { INDEX_URL, SUMMARY_URL } from '../constants';

interface UseIconsDataReturn {
  icons: Icon[];
  index: lunr.Index | null;
  isIndexLoaded: boolean;
  isLoading: boolean;
  categories: string[];
  subcategories: string[];
  summary: SummaryData | null;
}

export function useIconsData(): UseIconsDataReturn {
  const [icons, setIcons] = useState<Icon[]>([]);
  const [index, setIndex] = useState<lunr.Index | null>(null);
  const [isIndexLoaded, setIsIndexLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);
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

        // Charger le résumé
        try {
          const summaryResponse = await fetch(SUMMARY_URL);
          const summaryData = await summaryResponse.json();
          setSummary(summaryData);
        } catch {}

        console.log(`🔍 Index chargé : ${iconsData.length} icônes`);
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
    summary,
  };
}