import { describe, it, expect } from 'vitest';
import { assertIconArray } from './guards';

/** Objet minimal accepté par la garde. */
function icon(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a',
    title: 'Titre',
    source: 'yotopixels',
    tags: ['tag'],
    ...overrides,
  };
}

describe('assertIconArray', () => {
  it('accepte un tableau d’icônes bien formées (champs superflus tolérés)', () => {
    const payload = [icon(), icon({ id: 'b', extra: true })];
    expect(() => assertIconArray(payload)).not.toThrow();
  });

  it('accepte un tableau vide', () => {
    expect(() => assertIconArray([])).not.toThrow();
  });

  it('rejette un non-tableau (garde anti-cast aveugle)', () => {
    expect(() => assertIconArray({ id: 'a' })).toThrow(/tableau/i);
    expect(() => assertIconArray('nope')).toThrow(/tableau/i);
    expect(() => assertIconArray(null)).toThrow(/tableau/i);
    expect(() => assertIconArray(undefined)).toThrow(/tableau/i);
  });

  it('rejette un élément sans identifiant exploitable', () => {
    expect(() => assertIconArray([icon({ id: 123 })])).toThrow(/invalide/i);
    expect(() => assertIconArray([icon({ id: '' })])).toThrow(/invalide/i);
    expect(() => assertIconArray([{ noId: true }])).toThrow(/invalide/i);
    expect(() => assertIconArray([null])).toThrow(/invalide/i);
    expect(() => assertIconArray([icon(), icon({ id: 42 })])).toThrow(/invalide/i);
  });

  it('rejette un élément sans title ou source', () => {
    expect(() => assertIconArray([icon({ title: undefined })])).toThrow(/invalide/i);
    expect(() => assertIconArray([icon({ title: '' })])).toThrow(/invalide/i);
    expect(() => assertIconArray([icon({ source: 3 })])).toThrow(/invalide/i);
  });

  it('rejette un élément dont les tags ne sont pas un tableau de chaînes', () => {
    expect(() => assertIconArray([icon({ tags: undefined })])).toThrow(/invalide/i);
    expect(() => assertIconArray([icon({ tags: 'moon' })])).toThrow(/invalide/i);
    expect(() => assertIconArray([icon({ tags: [1, 2] })])).toThrow(/invalide/i);
  });

  it('n’effectue pas de cast aveugle : TypeScript sait que payload est typé après assertion', () => {
    const payload: unknown = [icon()];
    assertIconArray(payload);
    // Accès typé sans `as` : preuve que l'assertion fonctionne.
    const firstId: string = payload[0].id;
    const firstTags: string[] = payload[0].tags;
    expect(firstId).toBe('a');
    expect(firstTags).toEqual(['tag']);
  });
});
