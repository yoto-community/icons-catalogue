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

export interface SummaryData {
  total: number;
  byCategory: Record<string, number>;
  bySource?: {
    yotopixels: number;
    yotoicons: number;
    'yoto-official': number;
  };
}

export type SortOption = 'downloads' | 'title' | 'date';

export interface FilterState {
  query: string;
  category: string;
  subcategory: string;
  sortBy: SortOption;
  currentPage: number;
}