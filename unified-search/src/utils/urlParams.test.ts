import { describe, it, expect } from 'vitest';
import { toSortOption, toPageNumber, SORT_OPTIONS } from './urlParams';

describe('toSortOption', () => {
  it('accepte chaque variante valide', () => {
    expect(toSortOption('downloads')).toBe('downloads');
    expect(toSortOption('title')).toBe('title');
    expect(toSortOption('date')).toBe('date');
  });

  it('retourne la valeur par défaut pour une entrée invalide', () => {
    expect(toSortOption('hacker')).toBe('downloads');
    expect(toSortOption('')).toBe('downloads');
    expect(toSortOption(undefined)).toBe('downloads');
    expect(toSortOption(null)).toBe('downloads');
  });

  it('respecte un repli personnalisé', () => {
    expect(toSortOption('nimporte', 'title')).toBe('title');
  });

  it('ne casse pas sur des entrées hostiles (URL contrôlée par l’utilisateur)', () => {
    expect(toSortOption('<script>alert(1)</script>')).toBe('downloads');
    expect(toSortOption('__proto__')).toBe('downloads');
    expect(toSortOption('constructor')).toBe('downloads');
  });

  it('couvre exactement les variantes du type SortOption', () => {
    expect([...SORT_OPTIONS].sort()).toEqual(['date', 'downloads', 'title']);
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
