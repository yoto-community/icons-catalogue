import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { Icon, SummaryData } from '../types';
import { MANIFEST_URL, sourceShardUrl } from '../constants';

// Le moteur de recherche réel démarre un Web Worker : on le remplace par un
// double minimal et observable (les tests dédiés couvrent le moteur lui-même).
const { disposeMock, createSearchEngineMock } = vi.hoisted(() => ({
  disposeMock: vi.fn(),
  createSearchEngineMock: vi.fn(),
}));

vi.mock('../searchEngine', () => ({
  createSearchEngine: createSearchEngineMock,
}));

import { IconsDataProvider, useIconsData } from './IconsDataContext';

function icon(overrides: Partial<Icon> = {}): Icon {
  return {
    id: 'i1',
    source: 'yotopixels',
    tags: [],
    artist: '@auteur',
    title: 'Icône',
    preview_image: 'https://cdn/preview.png',
    download_url: 'https://cdn/download.png',
    category: 'nature',
    subcategory: 'lune',
    downloads: 3,
    date_added: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const manifest = {
  schemaVersion: 2,
  catalogVersion: '2024.01.01-1',
  counts: { total: 3 },
  sources: [
    { id: 'petite', count: 1 },
    { id: 'grosse', count: 2 },
  ],
};

const summary: SummaryData = {
  schemaVersion: 1,
  catalogVersion: '2024.01.01-1',
  updatedAt: '2024-01-01T00:00:00.000Z',
  total: 3,
  counts: {
    bySource: {},
    byCategory: {},
    byArtist: {},
    bySubcategory: {},
    topTags: {},
    topArtists: {},
  },
};

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Erreur',
    json: async () => body,
  } as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Routeur de `fetch` par URL ; le résumé répond par défaut. */
type RouteHandler = (url: string) => Response | Promise<Response>;

function stubFetch(handler: RouteHandler) {
  const fetchMock = vi.fn(async (url: string) => {
    if (String(url) === MANIFEST_URL) return handler(String(url));
    if (String(url).startsWith(sourceShardUrl(''))) return handler(String(url));
    return handler(String(url));
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function wrapper({ children }: { children: ReactNode }) {
  return <IconsDataProvider>{children}</IconsDataProvider>;
}

describe('IconsDataProvider', () => {
  beforeEach(() => {
    disposeMock.mockClear();
    createSearchEngineMock.mockReset();
    createSearchEngineMock.mockImplementation(() => ({
      ready: Promise.resolve(),
      isReady: () => true,
      search: async () => [],
      dispose: disposeMock,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('charge les shards progressivement : affiche dès le 1ᵉʳ, complète ensuite', async () => {
    const petite = deferred<Response>();
    const grosse = deferred<Response>();
    stubFetch((url) => {
      if (url === sourceShardUrl('petite')) return petite.promise;
      if (url === sourceShardUrl('grosse')) return grosse.promise;
      if (url === MANIFEST_URL) return jsonResponse(manifest);
      return jsonResponse(summary);
    });

    const { result } = renderHook(() => useIconsData(), { wrapper });

    // Le manifeste est lu, puis le premier shard (le plus petit) est demandé.
    await waitFor(() => expect(result.current.isLoading).toBe(true));
    await act(async () => {
      petite.resolve(jsonResponse([icon({ id: 'p' })]));
      await petite.promise;
    });

    await waitFor(() => expect(result.current.icons).toHaveLength(1));
    expect(result.current.isLoading).toBe(false); // grille affichable
    expect(result.current.isComplete).toBe(false);
    expect(createSearchEngineMock).not.toHaveBeenCalled(); // index pas encore

    await act(async () => {
      grosse.resolve(jsonResponse([icon({ id: 'g1' }), icon({ id: 'g2' })]));
      await grosse.promise;
    });

    await waitFor(() => expect(result.current.isComplete).toBe(true));
    expect(result.current.icons).toHaveLength(3);
    expect(result.current.error).toBeNull();

    // Index construit une seule fois, après complétion.
    await waitFor(() => expect(result.current.isSearchReady).toBe(true));
    expect(createSearchEngineMock).toHaveBeenCalledTimes(1);
  });

  it('demande les shards dans l’ordre croissant du manifeste', async () => {
    const calls: string[] = [];
    stubFetch((url) => {
      calls.push(url);
      if (url === MANIFEST_URL) return jsonResponse(manifest);
      if (url === sourceShardUrl('petite')) return jsonResponse([icon({ id: 'p' })]);
      if (url === sourceShardUrl('grosse')) return jsonResponse([icon({ id: 'g' })]);
      return jsonResponse(summary);
    });

    const { result } = renderHook(() => useIconsData(), { wrapper });
    await waitFor(() => expect(result.current.isComplete).toBe(true));

    const shardCalls = calls.filter((url) => url.includes('/icons-by-source/'));
    expect(shardCalls).toEqual([sourceShardUrl('petite'), sourceShardUrl('grosse')]);
  });

  it('dérive catégories/sous-catégories et expose le résumé', async () => {
    stubFetch((url) => {
      if (url === MANIFEST_URL) return jsonResponse(manifest);
      if (url === sourceShardUrl('petite')) return jsonResponse([icon({ id: 'a' })]);
      if (url === sourceShardUrl('grosse'))
        return jsonResponse([
          icon({ id: 'b', category: 'animaux', subcategory: 'chat' }),
          icon({ id: 'c', category: 'nature', subcategory: 'lune' }),
        ]);
      return jsonResponse(summary);
    });

    const { result } = renderHook(() => useIconsData(), { wrapper });
    await waitFor(() => expect(result.current.isComplete).toBe(true));

    expect(result.current.categories).toEqual(['animaux', 'nature']);
    expect(result.current.subcategories).toEqual(['chat', 'lune']);
    expect(result.current.summary).toEqual(summary);
  });

  it("tolère l'échec du résumé sans perdre les icônes", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stubFetch((url) => {
      if (url === MANIFEST_URL) return jsonResponse(manifest);
      if (url.includes('/icons-by-source/')) return jsonResponse([icon()]);
      return jsonResponse(null, false, 500);
    });

    const { result } = renderHook(() => useIconsData(), { wrapper });
    await waitFor(() => expect(result.current.isComplete).toBe(true));

    expect(result.current.icons).toHaveLength(2);
    expect(result.current.summary).toBeNull();
    expect(warn).toHaveBeenCalled();
  });

  it('expose une erreur et laisse la liste vide si le manifeste est invalide', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch((url) => {
      if (url === MANIFEST_URL) return jsonResponse({ pas: 'un manifeste' });
      return jsonResponse(summary);
    });

    const { result } = renderHook(() => useIconsData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.icons).toEqual([]);
    expect(result.current.error).toBeTruthy();
    expect(error).toHaveBeenCalled();
    expect(createSearchEngineMock).not.toHaveBeenCalled();
  });

  it('conserve les icônes déjà chargées si un shard suivante échoue', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetch((url) => {
      if (url === MANIFEST_URL) return jsonResponse(manifest);
      if (url === sourceShardUrl('petite')) return jsonResponse([icon({ id: 'p' })]);
      if (url === sourceShardUrl('grosse')) return jsonResponse(null, false, 500);
      return jsonResponse(summary);
    });

    const { result } = renderHook(() => useIconsData(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.icons).toHaveLength(1);
    expect(result.current.isComplete).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it("expose un message d'erreur quand le réseau échoue", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('Network down');
      })
    );

    const { result } = renderHook(() => useIconsData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeTruthy();
  });

  it('reload relance le chargement et efface l’erreur en cas de succès', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let manifestAttempts = 0;
    stubFetch((url) => {
      if (url === MANIFEST_URL) {
        manifestAttempts++;
        return manifestAttempts === 1
          ? jsonResponse({ pas: 'un manifeste' })
          : jsonResponse(manifest);
      }
      if (url.includes('/icons-by-source/')) return jsonResponse([icon({ id: 'ok' })]);
      return jsonResponse(summary);
    });

    const { result } = renderHook(() => useIconsData(), { wrapper });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.reload());

    await waitFor(() => expect(result.current.isComplete).toBe(true));
    expect(result.current.icons).toHaveLength(2);
    expect(result.current.error).toBeNull();
  });

  it('libère le moteur de recherche au démontage', async () => {
    stubFetch((url) => {
      if (url === MANIFEST_URL) return jsonResponse(manifest);
      if (url.includes('/icons-by-source/')) return jsonResponse([icon()]);
      return jsonResponse(summary);
    });
    const { result, unmount } = renderHook(() => useIconsData(), { wrapper });

    await waitFor(() => expect(result.current.isSearchReady).toBe(true));
    unmount();

    expect(disposeMock).toHaveBeenCalledTimes(1);
  });

  it('useIconsData lève une erreur en dehors du provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useIconsData())).toThrow(
      'useIconsData must be used within an IconsDataProvider'
    );
    spy.mockRestore();
  });
});
