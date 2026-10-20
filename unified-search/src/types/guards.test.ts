import { describe, it, expect } from 'vitest';
import { assertIconArray } from './guards';

describe('assertIconArray', () => {
  it('accepte un tableau d’objets avec un id string', () => {
    const payload = [{ id: 'a' }, { id: 'b', extra: true }];
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

  it('rejette un tableau dont un élément manque d’id valide', () => {
    expect(() => assertIconArray([{ id: 123 }])).toThrow(/invalide/i);
    expect(() => assertIconArray([{ noId: true }])).toThrow(/invalide/i);
    expect(() => assertIconArray([null])).toThrow(/invalide/i);
    expect(() => assertIconArray([{ id: 'ok' }, { id: 42 }])).toThrow(/invalide/i);
  });

  it('n’effectue pas de cast aveugle : TypeScript sait que payload est typé après assertion', () => {
    const payload: unknown = [{ id: 'x' }];
    assertIconArray(payload);
    // Accès typé sans `as` : preuve que l'assertion fonctionne.
    const firstId: string = payload[0].id;
    expect(firstId).toBe('x');
  });
});
