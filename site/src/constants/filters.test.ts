import { describe, it, expect } from 'vitest';
import {
  SOURCE_OPTIONS,
  LICENSE_LABELS,
  SOURCE_LABELS,
  getSourceLabel,
  getLicenseLabel,
} from './filters';

describe('libellés et options de filtres', () => {
  it('liste les trois sources du catalogue', () => {
    expect(SOURCE_OPTIONS).toEqual(['yotopixels', 'yotoicons', 'yoto-official']);
  });

  it('fournit un libellé par défaut pour chaque source', () => {
    for (const source of SOURCE_OPTIONS) {
      expect(SOURCE_LABELS[source], `libellé manquant pour « ${source} »`).toBeTruthy();
    }
  });

  it('définit les trois provenances comme clés de libellé', () => {
    expect(Object.keys(LICENSE_LABELS)).toEqual(['Unspecified', 'Source terms', 'Proprietary']);
    for (const [provenance, label] of Object.entries(LICENSE_LABELS)) {
      expect(label, `libellé manquant pour « ${provenance} »`).toBeTruthy();
    }
  });
});

describe('getSourceLabel', () => {
  it('retourne le libellé fr pour une source connue', () => {
    expect(getSourceLabel('yotopixels')).toBe('YotoPixels');
    expect(getSourceLabel('yoto-official')).toBe('Yoto officiel');
  });

  it('capitalise une source inconnue et gère la chaîne vide', () => {
    expect(getSourceLabel('autre')).toBe('Autre');
    expect(getSourceLabel('')).toBe('');
  });

  it('privilégie le traducteur quand la clé existe', () => {
    const t = (key: string) => (key === 'sourceLabels.yotopixels' ? 'YotoPixels (EN)' : key);
    expect(getSourceLabel('yotopixels', t)).toBe('YotoPixels (EN)');
  });

  it('retombe sur la table fr si le traducteur ne connaît pas la clé', () => {
    const t = (key: string) => key;
    expect(getSourceLabel('yotopixels', t)).toBe('YotoPixels');
    expect(getSourceLabel('inconnu', t)).toBe('Inconnu');
  });
});

describe('getLicenseLabel', () => {
  it('retourne le libellé fr pour une provenance connue', () => {
    expect(getLicenseLabel('Unspecified')).toBe('Non précisé');
    expect(getLicenseLabel('Source terms')).toBe('Conditions de la source');
    expect(getLicenseLabel('Proprietary')).toBe('Yoto — tous droits réservés');
  });

  it('retourne la valeur brute pour une provenance inconnue', () => {
    expect(getLicenseLabel('CC-BY-SA')).toBe('CC-BY-SA');
    expect(getLicenseLabel('')).toBe('');
  });

  it('privilégie le traducteur quand la clé existe', () => {
    const t = (key: string) => (key === 'licenseLabels.Proprietary' ? 'All rights reserved' : key);
    expect(getLicenseLabel('Proprietary', t)).toBe('All rights reserved');
  });

  it('retombe sur la table fr si le traducteur ne connaît pas la clé', () => {
    const t = (key: string) => key;
    expect(getLicenseLabel('Unspecified', t)).toBe('Non précisé');
  });
});
