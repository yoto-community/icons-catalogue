import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n';
import { SourcesPage } from './SourcesPage';
import type { SummaryData } from '../types';

const summary: SummaryData = {
  schemaVersion: 2,
  catalogVersion: '2026.10.26-2',
  updatedAt: '2026-10-26T10:40:59.217Z',
  total: 27150,
  counts: {
    bySource: { yotopixels: 1312, yotoicons: 25319, 'yoto-official': 519 },
    byCategory: {},
    byArtist: {},
    bySubcategory: {},
    topTags: {},
    topArtists: {},
  },
};

function renderPage(data: SummaryData | null) {
  return render(
    <I18nProvider defaultLocale="fr">
      <MemoryRouter>
        <SourcesPage summary={data} />
      </MemoryRouter>
    </I18nProvider>
  );
}

// jsdom expose `navigator.language = "en-US"`, ce qui ferait basculer le
// provider sur l'anglais : on force le français pour tester les libellés.
beforeEach(() => {
  localStorage.setItem('locale', 'fr');
});

describe('SourcesPage', () => {
  it('expose le titre et la description', () => {
    renderPage(null);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sources des icônes');
    expect(screen.getByText(/^Le catalogue réunit/)).toBeInTheDocument();
  });

  it('présente les trois sources avec leur provenance', () => {
    const { container } = renderPage(summary);
    for (const name of ['YotoPixels', 'YotoIcons', 'Yoto officiel']) {
      expect(screen.getByRole('heading', { level: 3, name: new RegExp(name) })).toBeInTheDocument();
    }
    const badges = [...container.querySelectorAll('.source-card__license')].map(
      (n) => n.textContent
    );
    expect(badges).toEqual([
      'Non précisé',
      'Conditions de la source',
      'Yoto — tous droits réservés',
    ]);
  });

  it('expose les conditions de chaque source et un avertissement global', () => {
    const { container } = renderPage(summary);
    const conditions = [...container.querySelectorAll('.source-card__conditions')];
    expect(conditions).toHaveLength(3);
    expect(conditions[0]?.textContent).toMatch(/Aucune licence ni CGU publiée/);
    expect(container.querySelector('.sources-disclaimer')?.textContent).toMatch(
      /Le catalogue ne concède aucun droit/
    );
  });

  it('lie les conditions publiées par la source, pas yotopixels', () => {
    const { container } = renderPage(summary);
    const terms = [...container.querySelectorAll<HTMLAnchorElement>('.source-card__terms')];
    expect(terms.map((a) => a.getAttribute('href'))).toEqual([
      'https://yotoicons.com/terms',
      'https://yoto.dev/reference/terms-and-conditions/',
    ]);
    for (const link of terms) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('affiche le nombre d’icônes par source depuis le résumé', () => {
    renderPage(summary);
    // Séparateur de milliers fr-FR = espace insécable étroit (U+202F).
    expect(screen.getByText(/1\s?312/)).toBeInTheDocument();
    expect(screen.getByText(/25\s?319/)).toBeInTheDocument();
    expect(screen.getByText('519')).toBeInTheDocument();
  });

  it('affiche un tiret à la place des compteurs sans résumé', () => {
    renderPage(null);
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('pointe chaque source vers son site, en lien sûr', () => {
    const { container } = renderPage(summary);
    const links = container.querySelectorAll<HTMLAnchorElement>('.source-card__name a');
    expect(links).toHaveLength(3);
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
    }
  });

  it('rend le balisage des traductions comme du HTML, pas du texte brut', () => {
    const { container } = renderPage(summary);
    expect(container.textContent).not.toContain('<strong>');
    expect(container.querySelectorAll('strong').length).toBeGreaterThan(0);
  });

  it('renvoie vers la page développeurs (lien interne)', () => {
    renderPage(summary);
    expect(screen.getByRole('link', { name: /API/ })).toHaveAttribute('href', '/developers');
  });
});
