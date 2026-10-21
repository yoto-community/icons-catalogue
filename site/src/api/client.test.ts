import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError, ENDPOINTS, API_BASE } from './client';
import { CATALOGUE_BASE, MANIFEST_URL, sourceShardUrl } from '../constants';
import type { SummaryData, Icon } from '../types';

const manifest = {
  schemaVersion: 2,
  catalogVersion: '2026.10.21-1',
  counts: { total: 1 },
  sources: [{ id: 's', count: 1 }],
};

const icon = { id: 'i1', title: 'Lune', source: 's', tags: [] } as unknown as Icon;

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
    expect(API_BASE).toBe(CATALOGUE_BASE);
    expect(API_BASE).toBe('/icons-catalogue');
    expect(ENDPOINTS.summary).toBe('/icons-catalogue/summary.json');
    expect(ENDPOINTS.manifest).toBe(MANIFEST_URL);
    expect(ENDPOINTS.sourceShard('yotoicons')).toBe(sourceShardUrl('yotoicons'));
    expect(ENDPOINTS.sourceShard('yotoicons')).toBe(
      '/icons-catalogue/icons-by-source/yotoicons.json'
    );
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

  it('getManifest renvoie le manifeste décodé quand il est valide', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => manifest });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.getManifest()).resolves.toEqual(manifest);
    expect(fetchMock).toHaveBeenCalledWith(ENDPOINTS.manifest);
  });

  it('getManifest lève sur un manifeste invalide', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

    await expect(apiClient.getManifest()).rejects.toThrow(/manifeste/i);
  });

  it('getSourceShard renvoie le tableau décodé', async () => {
    const icons = [icon];
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => icons });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.getSourceShard('s')).resolves.toEqual(icons);
    expect(fetchMock).toHaveBeenCalledWith(ENDPOINTS.sourceShard('s'));
  });

  it('getSourceShard rejette une charge non-tableau', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));

    await expect(apiClient.getSourceShard('s')).rejects.toThrow(/invalide/i);
  });

  it('lève une ApiError sur réponse non-OK (statut transporté)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' })
    );

    const error = await apiClient.getSourceShard('s').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(404);
    expect((error as Error).message).toContain('404');
    expect((error as Error).message).toContain(ENDPOINTS.sourceShard('s'));
  });

  it("propage l'erreur réseau sans la masquer", async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network down')));

    await expect(apiClient.getSummary()).rejects.toThrow('Network down');
  });
});
