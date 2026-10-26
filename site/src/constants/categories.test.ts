import { describe, it, expect } from 'vitest';
import {
  getCategoryLabel,
  getCategoryIcon,
  getSubcategoryLabel,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  DEFAULT_CATEGORY_ICON,
  SUBCATEGORY_LABELS,
} from './categories';
import fr from '../i18n/locales/fr.json';
import en from '../i18n/locales/en.json';

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

  it('utilise le traducteur fourni quand la clé existe', () => {
    const t = (key: string) => (key === 'categoryLabels.nature' ? 'Nature (EN)' : key);
    expect(getCategoryLabel('nature', t)).toBe('Nature (EN)');
  });

  it('retombe sur la table fr si le traducteur ne connaît pas la clé', () => {
    const t = (key: string) => key;
    expect(getCategoryLabel('nature', t)).toBe('Nature');
    // Catégorie inconnue : pas d'appel i18n, capitalisation du slug.
    expect(getCategoryLabel('inconnu', t)).toBe('Inconnu');
  });
});

describe('getSubcategoryLabel', () => {
  it('retourne le libellé fr pour une sous-catégorie connue', () => {
    expect(getSubcategoryLabel('lune')).toBe('Lune');
    expect(getSubcategoryLabel('vehicule')).toBe('Véhicule');
  });

  it('capitalise le slug inconnu et gère la chaîne vide', () => {
    expect(getSubcategoryLabel('autre-chose')).toBe('Autre-chose');
    expect(getSubcategoryLabel('')).toBe('');
  });

  it('privilégie le traducteur quand la clé existe', () => {
    const t = (key: string) => (key === 'subcategoryLabels.lune' ? 'Moon' : key);
    expect(getSubcategoryLabel('lune', t)).toBe('Moon');
    expect(getSubcategoryLabel('inconnu', t)).toBe('Inconnu');
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

  it('les catégories fr sont alignées sur les locales (source unique)', () => {
    expect(Object.keys(CATEGORY_LABELS).sort()).toEqual(Object.keys(fr.categoryLabels).sort());
    for (const [slug, label] of Object.entries(CATEGORY_LABELS)) {
      expect(fr.categoryLabels[slug as keyof typeof fr.categoryLabels], slug).toBe(label);
    }
    // Toute catégorie possède une traduction anglaise.
    expect(Object.keys(en.categoryLabels).sort()).toEqual(Object.keys(fr.categoryLabels).sort());
  });

  it('les sous-catégories fr sont alignées sur les locales (source unique)', () => {
    expect(Object.keys(SUBCATEGORY_LABELS).sort()).toEqual(
      Object.keys(fr.subcategoryLabels).sort()
    );
    for (const [slug, label] of Object.entries(SUBCATEGORY_LABELS)) {
      expect(fr.subcategoryLabels[slug as keyof typeof fr.subcategoryLabels], slug).toBe(label);
    }
    expect(Object.keys(en.subcategoryLabels).sort()).toEqual(
      Object.keys(fr.subcategoryLabels).sort()
    );
  });
});
