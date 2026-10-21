import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Icon } from '../types';
import { I18nProvider } from '../i18n';
import { YotoMiniPreview } from './YotoMiniPreview';

const icon: Icon = {
  id: 'yt-1',
  source: 'yotopixels',
  tags: ['star'],
  artist: 'sylvain',
  title: 'Étoile',
  preview_image: 'p.png',
  download_url: 'd.png',
  category: 'nature',
  subcategory: 'etoile',
  downloads: 3,
  date_added: '2024-01-01T00:00:00.000Z',
};

function renderPreview(previewedIcon: Icon | null) {
  return render(
    <I18nProvider defaultLocale="fr">
      <YotoMiniPreview previewedIcon={previewedIcon} />
    </I18nProvider>
  );
}

describe('YotoMiniPreview', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'fr');
  });

  it('affiche une invite quand aucune icône n’est prévisualisée', () => {
    const { container } = renderPreview(null);

    expect(container.querySelector('.yoto-mini-empty')).not.toBeNull();
    expect(container.querySelector('.yoto-mini-icon-overlay')).toBeNull();
    expect(
      screen.getByText("Cliquez sur l'icône 👁️ d'une carte pour voir l'aperçu")
    ).toBeInTheDocument();
  });

  it('affiche l’icône prévisualisée par-dessus le Yoto Mini', () => {
    const { container } = renderPreview(icon);

    const overlay = container.querySelector<HTMLImageElement>('.yoto-mini-icon-overlay');
    expect(overlay).not.toBeNull();
    expect(overlay?.getAttribute('alt')).toBe('Étoile');
    // URL relative normalisée avec la base de la source.
    expect(overlay?.getAttribute('src')).toBe('https://yotopixels.com/p.png');

    expect(container.querySelector('.yoto-mini-preview-icon-title')?.textContent).toBe('Étoile');
    expect(container.querySelector('.yoto-mini-preview-icon-artist')?.textContent).toBe(
      'par @sylvain'
    );

    const source = container.querySelector('.yoto-mini-preview-source');
    expect(source?.getAttribute('data-source')).toBe('yotopixels');
    expect(source?.textContent).toBe('Yotopixels');
  });
});
