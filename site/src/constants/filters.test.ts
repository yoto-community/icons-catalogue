import { describe, it, expect } from 'vitest';
import { SOURCE_OPTIONS, LICENSE_OPTIONS, SOURCE_LABELS, getSourceLabel } from './filters';

describe('options de filtres', () => {
  it('liste les trois sources du catalogue', () => {
    expect(SOURCE_OPTIONS).toEqual(['yotopixels', 'yotoicons', 'yoto-official']);
  });

  it('liste les trois licences du catalogue', () => {
    expect(LICENSE_OPTIONS).toEqual(['CC-BY-SA', 'CC-BY-NC', 'Yoto Official']);
  });

  it('fournit un libellé par défaut pour chaque source', () => {
    for (const source of SOURCE_OPTIONS) {
      expect(SOURCE_LABELS[source], `libellé manquant pour « ${source} »`).toBeTruthy();
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
