import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { FavoritesProvider } from './context/FavoritesContext';
import { IconsDataProvider } from './context/IconsDataContext';
import { MANIFEST_URL, sourceShardUrl } from './constants';
import App from './App';

const manifestPayload = {
  schemaVersion: 2,
  catalogVersion: '2024.01.01-1',
  counts: { total: 0 },
  sources: [{ id: 'yoto-official', count: 0 }],
};

const summaryPayload = {
  schemaVersion: 2,
  catalogVersion: '2024.01.01-1',
  updatedAt: '2024-01-01T00:00:00.000Z',
  total: 0,
  counts: {
    bySource: {},
    byCategory: {},
    byArtist: {},
    bySubcategory: {},
    topTags: {},
    topArtists: {},
  },
};

function renderApp(path = '/') {
  return render(
    <I18nProvider defaultLocale="fr">
      <MemoryRouter initialEntries={[path]}>
        <IconsDataProvider>
          <FavoritesProvider>
            <App />
          </FavoritesProvider>
        </IconsDataProvider>
      </MemoryRouter>
    </I18nProvider>
  );
}

/** Stub de `fetch` : catalogue vide, pour les routes qui ne dépendent pas des données. */
function stubEmptyCatalogue() {
  return vi.fn(async (url: string) => {
    if (String(url) === MANIFEST_URL) {
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => manifestPayload,
      } as Response;
    }
    if (String(url) === sourceShardUrl('yoto-official')) {
      return { ok: true, status: 200, statusText: 'OK', json: async () => [] } as Response;
    }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => summaryPayload,
    } as Response;
  });
}

describe('App — échec de chargement du catalogue', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));
  afterEach(() => vi.unstubAllGlobals());

  it('affiche un état d’erreur explicite puis recharge au clic sur Réessayer', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let manifestAttempts = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url) === MANIFEST_URL) {
          manifestAttempts++;
          if (manifestAttempts === 1) throw new Error('network down');
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => manifestPayload,
          } as Response;
        }
        if (String(url) === sourceShardUrl('yoto-official')) {
          return { ok: true, status: 200, statusText: 'OK', json: async () => [] } as Response;
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => summaryPayload,
        } as Response;
      })
    );

    renderApp();

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    screen.getByRole('button', { name: /réessayer/i }).click();

    await waitFor(() => expect(manifestAttempts).toBeGreaterThanOrEqual(2));
    // Après un rechargement réussi, l'état d'erreur disparaît.
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());

    errorSpy.mockRestore();
  });

  it('expose un lien d’évitement vers <main id="main-content">', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url) === MANIFEST_URL) {
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => manifestPayload,
          } as Response;
        }
        if (String(url) === sourceShardUrl('yoto-official')) {
          return { ok: true, status: 200, statusText: 'OK', json: async () => [] } as Response;
        }
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => summaryPayload,
        } as Response;
      })
    );

    renderApp();

    const skip = screen.getByRole('link', { name: 'Aller au contenu principal' });
    expect(skip).toHaveAttribute('href', '#main-content');
    expect(document.getElementById('main-content')?.tagName).toBe('MAIN');

    // Attend la fin du chargement du provider pour que ses mises à jour d'état
    // soient encadrées par `act` (sinon, avertissement après restauration du spy).
    await screen.findByRole('searchbox');

    errorSpy.mockRestore();
  });

  it('sert l’éditeur d’icônes sur la route /editor (chargement paresseux)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', stubEmptyCatalogue());

    renderApp('/editor');

    // Page chargée via `React.lazy` : elle apparaît après résolution du chunk.
    expect(await screen.findByRole('heading', { name: 'Éditeur d’icônes' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();

    errorSpy.mockRestore();
  });
});
