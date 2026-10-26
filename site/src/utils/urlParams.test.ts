import { describe, it, expect } from 'vitest';
import {
  toSortOption,
  toPageNumber,
  toSourceFilter,
  SORT_OPTIONS,
  DEFAULT_SORT,
} from './urlParams';

describe('toSortOption', () => {
  it('accepte chaque variante valide', () => {
    expect(toSortOption('downloads')).toBe('downloads');
    expect(toSortOption('title')).toBe('title');
  });

  it('rejette « date » (tri retiré : date_added = date de collecte)', () => {
    expect(toSortOption('date')).toBe(DEFAULT_SORT);
  });

  it('retourne la valeur par défaut pour une entrée invalide', () => {
    expect(toSortOption('hacker')).toBe(DEFAULT_SORT);
    expect(toSortOption('')).toBe(DEFAULT_SORT);
    expect(toSortOption(undefined)).toBe(DEFAULT_SORT);
    expect(toSortOption(null)).toBe(DEFAULT_SORT);
  });

  it('respecte un repli personnalisé', () => {
    expect(toSortOption('nimporte', 'downloads')).toBe('downloads');
  });

  it('ne casse pas sur des entrées hostiles (URL contrôlée par l’utilisateur)', () => {
    expect(toSortOption('<script>alert(1)</script>')).toBe(DEFAULT_SORT);
    expect(toSortOption('__proto__')).toBe(DEFAULT_SORT);
    expect(toSortOption('constructor')).toBe(DEFAULT_SORT);
  });

  it('couvre exactement les variantes du type SortOption', () => {
    expect([...SORT_OPTIONS].sort()).toEqual(['downloads', 'title']);
  });

  it('définit un tri par défaut qui est une variante valide', () => {
    expect(SORT_OPTIONS).toContain(DEFAULT_SORT);
  });
});

describe('toPageNumber', () => {
  it('accepte un entier positif valide', () => {
    expect(toPageNumber('3')).toBe(3);
    expect(toPageNumber('42')).toBe(42);
  });

  it('replie sur 1 pour les valeurs absentes ou invalides', () => {
    expect(toPageNumber(null)).toBe(1);
    expect(toPageNumber(undefined)).toBe(1);
    expect(toPageNumber('')).toBe(1);
    expect(toPageNumber('abc')).toBe(1);
    expect(toPageNumber('Infinity')).toBe(1);
    expect(toPageNumber('NaN')).toBe(1);
  });

  it('replie sur 1 pour les pages non positives', () => {
    expect(toPageNumber('0')).toBe(1);
    expect(toPageNumber('-5')).toBe(1);
  });

  it('tranche les décimales vers le bas (pas de page fractionnaire)', () => {
    expect(toPageNumber('2.9')).toBe(2);
  });
});

describe('toSourceFilter', () => {
  it('accepte chaque source connue', () => {
    expect(toSourceFilter('yotopixels')).toBe('yotopixels');
    expect(toSourceFilter('yotoicons')).toBe('yotoicons');
    expect(toSourceFilter('yoto-official')).toBe('yoto-official');
  });

  it('rejette une source inconnue ou absente', () => {
    expect(toSourceFilter('autre')).toBe('');
    expect(toSourceFilter('')).toBe('');
    expect(toSourceFilter(null)).toBe('');
    expect(toSourceFilter(undefined)).toBe('');
    expect(toSourceFilter('__proto__')).toBe('');
  });
});
