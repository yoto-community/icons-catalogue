import type { Icon } from '../types';

export function normalizeUrl(url: string, source: Icon['source']): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = source === 'yotopixels' ? 'https://yotopixels.com' : 'https://yotoicons.com';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function getSourceUrl(icon: Icon): string {
  if (icon.source === 'yotopixels') {
    // L'id canonique est désormais un hash de contenu : l'id natif vit dans
    // `metadata.source_id` (repli `original_id` pour les données historiques).
    const sourceId = icon.metadata?.source_id ?? icon.metadata?.original_id ?? icon.id;
    return `https://yotopixels.com/icons/${sourceId}`;
  }
  if (icon.source === 'yoto-official') {
    return `https://yoto.dev/icons/using-icons/`;
  }
  // yotoicons : page de détail d'origine (repli : le site).
  return icon.metadata?.detail_url || 'https://www.yotoicons.com';
}

export function getSourceLabel(source: Icon['source']): string {
  switch (source) {
    case 'yotopixels':
      return 'Yotopixels';
    case 'yotoicons':
      return 'Yotoicons';
    case 'yoto-official':
      return 'Yoto Officiel';
    default:
      return source;
  }
}

export function getSourceBadge(source: Icon['source']): string {
  switch (source) {
    case 'yotopixels':
      return 'YTP';
    case 'yotoicons':
      return 'YI';
    case 'yoto-official':
      return 'YO';
    default: {
      // Valeur hors union (données JSON non garanties) : fallback défensif sans cast.
      const s = String(source);
      return s.slice(0, 2).toUpperCase();
    }
  }
}

/**
 * URL de la page d'un auteur, alignée sur la route `/authors/:artist`
 * (cf. `AuthorsListPage` / `AuthorIconsPage`). Le nom est encodé pour rester
 * sûr quel que soit son contenu (espaces, accents, `@`…).
 */
export function getArtistUrl(artist: string): string {
  return `/authors/${encodeURIComponent(artist)}`;
}
