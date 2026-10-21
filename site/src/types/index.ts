export interface Icon {
  id: string;
  source: 'yotopixels' | 'yotoicons' | 'yoto-official';
  tags: string[];
  artist: string;
  title: string;
  preview_image: string;
  download_url: string;
  category: string;
  subcategory: string;
  downloads: number;
  date_added: string;
  license?: string;
  metadata?: {
    original_id?: string;
    creator_id?: string;
    /** Identifiant numérique d'origine sur yotoicons (ex. « 1234 »). */
    numeric_id?: string;
    /** URL de la page de détail d'origine (yotoicons). */
    detail_url?: string;
    /** Identifiant média d'origine côté API Yoto (yoto-official). */
    media_id?: string;
    /** Marqueur des icônes officielles Yoto. */
    official?: boolean;
    /**
     * Id de l'icône canonique quand cette icône est un doublon inter-sources
     * (détecté au build, P1.4).
     */
    duplicate_of?: string;
  };
}

export interface SummaryCounts {
  bySource: Record<string, number>;
  byCategory: Record<string, number>;
  byArtist: Record<string, number>;
  bySubcategory: Record<string, number>;
  topTags: Record<string, number>;
  topArtists: Record<string, number>;
}

export interface SummaryData {
  schemaVersion: number;
  catalogVersion: string;
  updatedAt: string;
  total: number;
  counts: SummaryCounts;
  /** Doublons inter-sources détectés au build (P1.4). */
  duplicates?: {
    groups: number;
    icons: number;
  };
}

export type SortOption = 'downloads' | 'title';

export interface FilterState {
  query: string;
  category: string;
  subcategory: string;
  source: string;
  license: string;
  sortBy: SortOption;
  currentPage: number;
  backgroundColor?: string;
}
