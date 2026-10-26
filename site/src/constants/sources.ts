import type { SOURCE_OPTIONS } from './filters';

export interface SourceMeta {
  /** Identifiant aligné sur `SOURCE_OPTIONS` (filtres) et `scripts/build-api.js`. */
  id: (typeof SOURCE_OPTIONS)[number];
  /** Site public de la source (lien sortant depuis la page Sources). */
  url: string;
  /**
   * Provenance/conditions appliquées à toutes les icônes de la source.
   *
   * Alignée sur `scripts/lib/source-licenses.js` (source de vérité du build).
   * **Ce n'est pas un identifiant de licence CC/SPDX** : aucune source n'en
   * déclare (vérifié le 2026-10-26). Il n'existe pas de
   * filtre par provenance (chaque source a une provenance unique) ; la valeur
   * est affichée sur la page Sources et la fiche d'icône.
   */
  license: string;
  /**
   * URL des conditions/mentions de la source, quand elle en publie une.
   * Absente si la source ne publie aucune page légale (ex. yotopixels).
   */
  termsUrl?: string;
}

/**
 * Métadonnées d'affichage des sources (site, licence).
 *
 * Source unique de vérité côté front pour la page « Sources » : les
 * descriptions et natures (communautaire/officiel) vivent dans les locales
 * (`sourcesPage.descriptions.*`, `sourcesPage.natures.*`), les compteurs dans
 * `summary.counts.bySource`.
 */
export const SOURCE_META: readonly SourceMeta[] = [
  // yotopixels : aucune page légale hors politique de confidentialité (pas de
  // CGU, `/terms` et `/about` = 404) → pas de `termsUrl`.
  { id: 'yotopixels', url: 'https://yotopixels.com', license: 'Unspecified' },
  {
    id: 'yotoicons',
    url: 'https://yotoicons.com',
    license: 'Source terms',
    termsUrl: 'https://yotoicons.com/terms',
  },
  {
    id: 'yoto-official',
    url: 'https://yoto.dev/icons/using-icons/',
    license: 'Proprietary',
    termsUrl: 'https://yoto.dev/reference/terms-and-conditions/',
  },
];
