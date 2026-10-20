import type { Icon, SummaryData } from '../types';

export const API_BASE = '/icons-catalogue' as const;

export const ENDPOINTS = {
  summary: `${API_BASE}/summary.json`,
  searchIndex: `${API_BASE}/search-index.json`,
  combinedIcons: `${API_BASE}/icons.json`,
  apiSummary: `${API_BASE}/api/summary.json`,
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
  /**
   * Fetch the catalog summary with typed response
   */
  async getSummary(): Promise<SummaryData> {
    return fetchJson<SummaryData>(ENDPOINTS.summary);
  },

  /**
   * Fetch all icons with typed response
   */
  async getIcons(): Promise<Icon[]> {
    return fetchJson<Icon[]>(ENDPOINTS.combinedIcons);
  },

  /**
   * Fetch the Lunr search index
   */
  async getSearchIndex(): Promise<unknown> {
    return fetchJson<unknown>(ENDPOINTS.searchIndex);
  },

  /**
   * Fetch the API summary (alternative endpoint)
   */
  async getApiSummary(): Promise<SummaryData> {
    return fetchJson<SummaryData>(ENDPOINTS.apiSummary);
  },
};

export type { Icon, SummaryData };
