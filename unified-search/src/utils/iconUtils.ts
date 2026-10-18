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
    return `https://yotopixels.com/icons/${icon.metadata?.original_id || icon.id.replace('yt-', '')}`;
  }
  if (icon.source === 'yoto-official') {
    return `https://yoto.dev/icons/using-icons/`;
  }
  return `https://card-content.yotoplay.com/yoto/${icon.id.replace('yi-', '')}`;
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
      const s = source as string;
      return s.slice(0, 2).toUpperCase();
    }
  }
}