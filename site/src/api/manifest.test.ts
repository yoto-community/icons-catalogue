import { describe, it, expect } from 'vitest';
import { isCatalogueManifest, planSourceOrder, type ManifestSource } from './manifest';

describe('isCatalogueManifest', () => {
  const valid = {
    schemaVersion: 2,
    catalogVersion: '2026.10.21-1',
    counts: { total: 3 },
    sources: [{ id: 'a', count: 2 }],
  };

  it('accepte un manifeste valide', () => {
    expect(isCatalogueManifest(valid)).toBe(true);
  });

  it('refuse un objet sans sources exploitables', () => {
    expect(isCatalogueManifest({ ...valid, sources: [] })).toBe(false);
    expect(isCatalogueManifest({ ...valid, sources: [{ id: 'a' }] })).toBe(false);
    expect(isCatalogueManifest({ ...valid, sources: 'nope' })).toBe(false);
  });

  it('refuse une forme non-objet ou sans compteurs', () => {
    expect(isCatalogueManifest(null)).toBe(false);
    expect(isCatalogueManifest('x')).toBe(false);
    expect(isCatalogueManifest([])).toBe(false);
    expect(isCatalogueManifest({ sources: [{ id: 'a', count: 1 }] })).toBe(false);
  });

  it('refuse un schéma non numérique', () => {
    expect(isCatalogueManifest({ ...valid, schemaVersion: '2' })).toBe(false);
  });

  it('refuse un compteur total absent ou non numérique', () => {
    expect(isCatalogueManifest({ ...valid, counts: undefined })).toBe(false);
    expect(isCatalogueManifest({ ...valid, counts: { total: '3' } })).toBe(false);
  });

  it('refuse des sources dont un élément n’est pas exploitable', () => {
    expect(isCatalogueManifest({ ...valid, sources: [null] })).toBe(false);
    expect(isCatalogueManifest({ ...valid, sources: ['x'] })).toBe(false);
    expect(isCatalogueManifest({ ...valid, sources: [{ id: 'a', count: '2' }] })).toBe(false);
  });
});

describe('planSourceOrder', () => {
  it('trie par effectif croissant', () => {
    const sources: ManifestSource[] = [
      { id: 'gros', count: 100 },
      { id: 'petit', count: 5 },
      { id: 'moyen', count: 20 },
    ];
    expect(planSourceOrder(sources)).toEqual(['petit', 'moyen', 'gros']);
  });

  it('départage à effectif égal par id croissant', () => {
    const sources: ManifestSource[] = [
      { id: 'b', count: 10 },
      { id: 'a', count: 10 },
    ];
    expect(planSourceOrder(sources)).toEqual(['a', 'b']);
  });

  it('ne mute pas l’entrée', () => {
    const sources: ManifestSource[] = [
      { id: 'a', count: 2 },
      { id: 'b', count: 1 },
    ];
    planSourceOrder(sources);
    expect(sources.map((s) => s.id)).toEqual(['a', 'b']);
  });
});
