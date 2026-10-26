import { describe, it, expect } from 'vitest';
import { SOURCE_META } from './sources';
import { SOURCE_OPTIONS, LICENSE_LABELS } from './filters';

describe('SOURCE_META', () => {
  it('couvre exactement les sources du filtre, dans le même ordre', () => {
    expect(SOURCE_META.map((s) => s.id)).toEqual([...SOURCE_OPTIONS]);
  });

  it('expose une URL https et une provenance connue pour chaque source', () => {
    for (const source of SOURCE_META) {
      expect(source.url, `URL manquante pour « ${source.id} »`).toMatch(/^https:\/\//);
      expect(Object.keys(LICENSE_LABELS), `provenance inconnue pour « ${source.id} »`).toContain(
        source.license
      );
    }
  });

  it('associe une provenance distincte à chaque source', () => {
    // Justifie l'absence de filtre par provenance : source ↔ provenance est une
    // bijection, donc filtrer par provenance ferait doublon avec la source.
    const provenances = SOURCE_META.map((s) => s.license);
    expect(new Set(provenances).size).toBe(provenances.length);
  });

  it('expose un termsUrl https quand la source publie des conditions', () => {
    for (const source of SOURCE_META) {
      if (source.termsUrl !== undefined) {
        expect(source.termsUrl, `termsUrl non https pour « ${source.id} »`).toMatch(/^https:\/\//);
      }
    }
  });

  it('n’attribue aucune licence Creative Commons', () => {
    // Vérification 2026-10-26 : aucune source ne place ses icônes sous CC.
    for (const source of SOURCE_META) {
      expect(source.license.startsWith('CC-')).toBe(false);
    }
  });
});
