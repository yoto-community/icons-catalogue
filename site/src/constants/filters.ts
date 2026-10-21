import type { Translator } from './categories';

/**
 * Options du filtre « source » (source unique de vérité côté front).
 *
 * Alignées sur les valeurs `source` produites par `scripts/build-api.js`.
 */
export const SOURCE_OPTIONS = ['yotopixels', 'yotoicons', 'yoto-official'] as const;

/**
 * Options du filtre « licence ».
 *
 * Alignées sur `scripts/lib/source-licenses.js` (niveaux de licence attribués
 * par source lors du build).
 */
export const LICENSE_OPTIONS = ['CC-BY-SA', 'CC-BY-NC', 'Yoto Official'] as const;

/** Libellés par défaut (fr) des sources, en repli des traductions i18n. */
export const SOURCE_LABELS: Record<string, string> = {
  yotopixels: 'YotoPixels',
  yotoicons: 'YotoIcons',
  'yoto-official': 'Yoto officiel',
};

/** Capitalise un slug ASCII en repli (« autre » → « Autre »). */
function capitalize(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Retourne le libellé lisible d'une source (mêmes règles que
 * `getCategoryLabel` : traduction `sourceLabels.<id>` si disponible, sinon
 * table fr statique, sinon capitalisation du slug).
 */
export function getSourceLabel(source: string, t?: Translator): string {
  if (t && SOURCE_LABELS[source]) {
    const key = `sourceLabels.${source}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return SOURCE_LABELS[source] || capitalize(source);
}
