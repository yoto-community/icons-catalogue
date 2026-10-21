import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { DevelopersPage } from './DevelopersPage';
import type { SummaryData } from '../types';

const summary: SummaryData = {
  schemaVersion: 2,
  catalogVersion: '2026.10.19-1',
  updatedAt: '2026-10-19T22:51:52.819Z',
  total: 27399,
  counts: {
    bySource: { yotopixels: 1314, yotoicons: 25566, 'yoto-official': 519 },
    byCategory: { objets: 26893, nature: 84, animaux: 222 },
    byArtist: {},
    bySubcategory: {},
    topTags: {},
    topArtists: {},
  },
};

function renderPage(data: SummaryData | null) {
  return render(
    <I18nProvider defaultLocale="fr">
      <DevelopersPage summary={data} />
    </I18nProvider>
  );
}

// jsdom expose `navigator.language = "en-US"`, ce qui ferait basculer le
// provider sur l'anglais : on force le français pour tester les libellés.
beforeEach(() => {
  localStorage.setItem('locale', 'fr');
});

describe('DevelopersPage', () => {
  it('expose le titre et la description', () => {
    renderPage(null);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('API développeurs');
  });

  it('affiche les statistiques en direct quand le résumé est disponible', () => {
    renderPage(summary);
    // Le séparateur de milliers fr-FR est un espace insécable étroit (U+202F).
    expect(screen.getByText(/27\s?399/)).toBeInTheDocument();
    // 3 sources et 3 catégories dans le fixture.
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(2);
  });

  it('affiche un état de chargement sans résumé', () => {
    renderPage(null);
    expect(screen.getByText(/Chargement des statistiques/)).toBeInTheDocument();
  });

  it('rend le balisage des traductions comme du HTML, pas du texte brut', () => {
    const { container } = renderPage(summary);
    expect(container.textContent).not.toContain('<code>');
    expect(container.querySelectorAll('code').length).toBeGreaterThan(0);
  });

  it('documente les endpoints publiés (résumé, manifeste, shards)', () => {
    renderPage(summary);
    for (const file of ['summary.json', 'index.json', 'icons-by-source']) {
      expect(screen.getAllByText(new RegExp(file)).length).toBeGreaterThan(0);
    }
    // P1.3 : `icons.json` n'est plus publié → plus annoncé comme endpoint.
    expect(screen.queryByText(/\/icons\.json/)).toBeNull();
  });
});
