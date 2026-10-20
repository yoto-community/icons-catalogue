import { describe, it, expect } from 'vitest';
import {
  getCategoryLabel,
  getCategoryIcon,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  DEFAULT_CATEGORY_ICON,
} from './categories';

describe('getCategoryLabel', () => {
  it('retourne le libellé traduit pour une catégorie connue', () => {
    expect(getCategoryLabel('nature')).toBe('Nature');
    expect(getCategoryLabel('nourriture')).toBe('Nourriture');
    expect(getCategoryLabel('fetes')).toBe('Fêtes');
  });

  it('capitalise le slug pour une catégorie inconnue', () => {
    expect(getCategoryLabel('inconnu')).toBe('Inconnu');
    expect(getCategoryLabel('autre-chose')).toBe('Autre-chose');
  });

  it('gère la chaîne vide sans planter', () => {
    expect(getCategoryLabel('')).toBe('');
  });
});

describe('getCategoryIcon', () => {
  it("retourne l'emoji d'une catégorie connue", () => {
    expect(getCategoryIcon('animaux')).toBe('🐾');
    expect(getCategoryIcon('musique')).toBe('🎵');
  });

  it("retombe sur l'icône par défaut sinon", () => {
    expect(getCategoryIcon('inconnu')).toBe(DEFAULT_CATEGORY_ICON);
    expect(getCategoryIcon('')).toBe(DEFAULT_CATEGORY_ICON);
  });
});

describe('cohérence des tables de catégories', () => {
  it('chaque catégorie labellisée possède un emoji', () => {
    for (const key of Object.keys(CATEGORY_LABELS)) {
      expect(CATEGORY_ICONS[key], `emoji manquant pour « ${key} »`).toBeDefined();
    }
  });

  it('chaque emoji référence une catégorie labellisée', () => {
    for (const key of Object.keys(CATEGORY_ICONS)) {
      expect(CATEGORY_LABELS[key], `libellé manquant pour « ${key} »`).toBeDefined();
    }
  });
});
