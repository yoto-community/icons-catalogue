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
    /**
     * Identifiant **natif** de la source (provenance) : uuid yotopixels,
     * id numérique yotoicons, `mediaId` officiel. L'`id` canonique, lui, est un
     * hash de contenu (cf. `base64url(sha256)`).
     */
    source_id?: string;
    /** Format de l'identifiant de contenu porté par `id` (toujours « base64url »). */
    content_encoding?: string;
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
    /** Identifiants natifs des sources fusionnées (doublons de contenu exacts). */
    merged_source_ids?: string[];
    /** Nombre d'entrées de contenu fusionnées dans cette icône canonique. */
    merged_count?: number;
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
  /**
   * Doublons détectés au build : déduplication **sémantique** inter-sources
   * (P1.4, `groups`/`icons`) et **fusion de contenu** exact (`content`).
   */
  duplicates?: {
    groups: number;
    icons: number;
    content?: {
      groups: number;
      merged: number;
    };
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
