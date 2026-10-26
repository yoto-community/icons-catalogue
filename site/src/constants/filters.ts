import type { Translator } from './categories';

/**
 * Options du filtre « source » (source unique de vérité côté front).
 *
 * Alignées sur les valeurs `source` produites par `scripts/build-api.js`.
 */
export const SOURCE_OPTIONS = ['yotopixels', 'yotoicons', 'yoto-official'] as const;

/**
 * Libellés par défaut (fr) des sources, en repli des traductions i18n.
 */
export const SOURCE_LABELS: Record<string, string> = {
  yotopixels: 'YotoPixels',
  yotoicons: 'YotoIcons',
  'yoto-official': 'Yoto officiel',
};

/**
 * Libellés par défaut (fr) des provenances/licences, en repli des traductions.
 *
 * Les **clés** sont les valeurs canoniques de provenance (alignées sur
 * `scripts/lib/source-licenses.js`). Il n'y a **pas** de filtre par provenance :
 * chaque source ayant une provenance unique, filtrer par provenance ferait
 * doublon avec le filtre « source ». La provenance reste **affichée** (fiche
 * d'icône, page Sources).
 *
 * Ce ne sont **pas** des identifiants Creative Commons/SPDX : aucune des sources
 * ne place ses icônes sous une licence standard (vérifié le 2026-10-26).
 */
export const LICENSE_LABELS: Record<string, string> = {
  Unspecified: 'Non précisé',
  'Source terms': 'Conditions de la source',
  Proprietary: 'Yoto — tous droits réservés',
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

/**
 * Retourne le libellé lisible d'une provenance/licence (mêmes règles que
 * `getSourceLabel` : traduction `licenseLabels.<id>` si disponible, sinon table
 * fr statique, sinon la valeur brute — qui est déjà lisible).
 */
export function getLicenseLabel(license: string, t?: Translator): string {
  if (t && LICENSE_LABELS[license]) {
    const key = `licenseLabels.${license}`;
    const translated = t(key);
    if (translated !== key) return translated;
  }
  return LICENSE_LABELS[license] || license;
}
