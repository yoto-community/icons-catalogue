import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError, ENDPOINTS, API_BASE } from './client';
import type { SummaryData, Icon } from '../types';

const summary: SummaryData = {
  schemaVersion: 1,
  catalogVersion: '2026.1.0',
  updatedAt: '2026-01-01T00:00:00.000Z',
  total: 3,
  counts: {
    bySource: { yotoicons: 3 },
    byCategory: { nature: 3 },
    byArtist: {},
    bySubcategory: {},
    topTags: {},
    topArtists: {},
  },
};

describe('constantes de point de terminaison', () => {
  it('toutes construites depuis API_BASE', () => {
    expect(API_BASE).toBe('/icons-catalogue');
    expect(ENDPOINTS.summary).toBe('/icons-catalogue/summary.json');
    expect(ENDPOINTS.combinedIcons).toBe('/icons-catalogue/icons.json');
    expect(ENDPOINTS.searchIndex).toBe('/icons-catalogue/search-index.json');
    expect(ENDPOINTS.apiSummary).toBe('/icons-catalogue/api/summary.json');
  });
});

describe('ApiError', () => {
  it('conserve instanceof Error, name, status et response', () => {
    const response = new Response('{}', { status: 503, statusText: 'Unavailable' });
    const err = new ApiError('échec', response);

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(503);
    expect(err.response).toBe(response);
    expect(err.message).toBe('échec');
  });
});

describe('apiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getSummary interroge le bon endpoint et renvoie les données typées', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => summary,
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.getSummary()).resolves.toEqual(summary);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(ENDPOINTS.summary);
  });

  it('getIcons renvoie le tableau décodé', async () => {
    const icons = [{ id: 'i1', title: 'Lune' }] as unknown as Icon[];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => icons }));

    await expect(apiClient.getIcons()).resolves.toEqual(icons);
    expect(fetch).toHaveBeenCalledWith(ENDPOINTS.combinedIcons);
  });

  it('lève une ApiError sur réponse non-OK (statut transporté)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' })
    );

    const error = await apiClient.getSearchIndex().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect((error as Error).message).toContain('404');
    expect((error as Error).message).toContain(ENDPOINTS.searchIndex);
  });

  it("propage l'erreur réseau sans la masquer", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network down')));

    await expect(apiClient.getApiSummary()).rejects.toThrow('Network down');
  });

  it("getApiSummary cible l'endpoint alternatif", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => summary,
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.getApiSummary();
    expect(fetchMock).toHaveBeenCalledWith(ENDPOINTS.apiSummary);
  });
});
