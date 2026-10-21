import type { Icon, SummaryData } from '../types';
import { assertIconArray } from '../types/guards';
import { CATALOGUE_BASE, MANIFEST_URL, sourceShardUrl } from '../constants';
import { isCatalogueManifest, type CatalogueManifest } from './manifest';

/**
 * Base publique du catalogue. Source unique : `CATALOGUE_BASE` (alignée sur le
 * `base` de `vite.config.ts`), afin d'éviter la dérive des chemins en dur.
 */
export const API_BASE = CATALOGUE_BASE;

export const ENDPOINTS = {
  summary: `${API_BASE}/summary.json`,
  manifest: MANIFEST_URL,
  sourceShard: (source: string) => sourceShardUrl(source),
} as const;

/**
 * Erreur typée levée par l'API client. Classe (et non interface + cast)
 * pour conserver un `instanceof` fiable côté appelant.
 */
export class ApiError extends Error {
  readonly status?: number;
  readonly response?: Response;

  constructor(message: string, response: Response) {
    super(message);
    this.name = 'ApiError';
    this.status = response.status;
    this.response = response;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ApiError(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
      response
    );
  }
  return (await response.json()) as T;
}

export const apiClient = {
  /** Récupère le résumé typé du catalogue. */
  async getSummary(): Promise<SummaryData> {
    return fetchJson<SummaryData>(ENDPOINTS.summary);
  },

  /** Récupère le manifeste publié (`index.json`) et valide sa forme. */
  async getManifest(): Promise<CatalogueManifest> {
    const data = await fetchJson<unknown>(ENDPOINTS.manifest);
    if (!isCatalogueManifest(data)) {
      throw new Error('Manifeste du catalogue invalide (index.json)');
    }
    return data;
  },

  /** Récupère le shard JSON d'une source ; garantit un tableau d'icônes. */
  async getSourceShard(source: string): Promise<Icon[]> {
    const data = await fetchJson<unknown>(ENDPOINTS.sourceShard(source));
    assertIconArray(data);
    return data;
  },
};

export type { Icon, SummaryData };
