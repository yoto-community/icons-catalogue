import { describe, it, expect } from 'vitest';
import {
  normalizeUrl,
  getSourceUrl,
  getSourceLabel,
  getSourceBadge,
  getArtistUrl,
} from './iconUtils';
import type { Icon } from '../types';

function makeIcon(overrides: Partial<Icon> = {}): Icon {
  return {
    id: 'yt-abc',
    source: 'yotopixels',
    tags: [],
    artist: 'artist',
    title: 'title',
    preview_image: '/preview.png',
    download_url: '/download.png',
    category: 'objets',
    subcategory: 'autre',
    downloads: 0,
    date_added: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('normalizeUrl', () => {
  it('conserve les URLs absolues', () => {
    expect(normalizeUrl('https://example.com/a.png', 'yotopixels')).toBe(
      'https://example.com/a.png'
    );
    expect(normalizeUrl('http://example.com/a.png', 'yotopixels')).toBe('http://example.com/a.png');
  });

  it("conserve les data: URI (fallback d'image)", () => {
    expect(normalizeUrl('data:image/svg+xml,%3Csvg%3E', 'yotoicons')).toContain(
      'data:image/svg+xml'
    );
  });

  it('préfixe les chemins relatifs selon la source', () => {
    expect(normalizeUrl('/a.png', 'yotopixels')).toBe('https://yotopixels.com/a.png');
    expect(normalizeUrl('/a.png', 'yotoicons')).toBe('https://yotoicons.com/a.png');
    expect(normalizeUrl('a.png', 'yotoicons')).toBe('https://yotoicons.com/a.png');
  });

  it('gère la chaîne vide', () => {
    expect(normalizeUrl('', 'yotopixels')).toBe('');
  });
});

describe('getSourceUrl', () => {
  it('construit l’URL yotopixels depuis source_id (repli original_id)', () => {
    expect(getSourceUrl(makeIcon({ source: 'yotopixels', metadata: { source_id: '42' } }))).toBe(
      'https://yotopixels.com/icons/42'
    );
    // Repli sur l'ancien champ `original_id` (données historiques).
    expect(getSourceUrl(makeIcon({ source: 'yotopixels', metadata: { original_id: '42' } }))).toBe(
      'https://yotopixels.com/icons/42'
    );
  });

  it('retourne la page officielle pour yoto-official', () => {
    expect(getSourceUrl(makeIcon({ source: 'yoto-official' }))).toBe(
      'https://yoto.dev/icons/using-icons/'
    );
  });

  it('retourne la page de détail yotoicons, sinon le site', () => {
    const icon = makeIcon({
      source: 'yotoicons',
      metadata: { detail_url: 'https://www.yotoicons.com/icons?tag=Bluey' },
    });
    expect(getSourceUrl(icon)).toBe('https://www.yotoicons.com/icons?tag=Bluey');
    expect(getSourceUrl(makeIcon({ source: 'yotoicons' }))).toBe('https://www.yotoicons.com');
  });
});

describe('getSourceLabel', () => {
  it('couvre les trois sources', () => {
    expect(getSourceLabel('yotopixels')).toBe('Yotopixels');
    expect(getSourceLabel('yotoicons')).toBe('Yotoicons');
    expect(getSourceLabel('yoto-official')).toBe('Yoto Officiel');
  });
});

describe('getSourceBadge', () => {
  it('retourne les badges attendus', () => {
    expect(getSourceBadge('yotopixels')).toBe('YTP');
    expect(getSourceBadge('yotoicons')).toBe('YI');
    expect(getSourceBadge('yoto-official')).toBe('YO');
  });

  it('replie proprement sur une source hors union sans planter', () => {
    // Le JSON distant n'est pas typé : une valeur inconnue ne doit pas throw.
    expect(getSourceBadge('inconnue' as Icon['source'])).toBe('IN');
  });
});

describe('getArtistUrl', () => {
  it('pointe vers la route auteur et encode le nom', () => {
    expect(getArtistUrl('@alice')).toBe('/authors/%40alice');
    expect(getArtistUrl('Jean Dupont/É')).toBe(`/authors/${encodeURIComponent('Jean Dupont/É')}`);
  });
});
