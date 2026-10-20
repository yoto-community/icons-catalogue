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
    color_palette?: string[];
    dominant_colors?: string[];
    original_id?: string;
    creator_id?: string;
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
}

export type SortOption = 'downloads' | 'title' | 'date';

export interface FilterState {
  query: string;
  category: string;
  subcategory: string;
  sortBy: SortOption;
  currentPage: number;
  backgroundColor?: string;
}
