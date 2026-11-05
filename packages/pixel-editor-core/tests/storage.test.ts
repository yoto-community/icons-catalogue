import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGrid, setPixel } from '../src/pixel-editor';
import { clearDraft, isDraftStorageAvailable, loadDraft, saveDraft } from '../src/storage';

/** Clé de test : le cœur n'impose plus de clé, c'est l'appelant qui la choisit. */
const KEY = 'test:editor-draft';

function storedDraft(overrides: Record<string, unknown>): string {
  return JSON.stringify({ v: 1, g: 'x', t: 123, ...overrides });
}

describe('editorStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('ne renvoie rien quand aucun brouillon n’est enregistré', () => {
    expect(loadDraft(KEY)).toBeNull();
  });

  it('enregistre puis relit la grille à l’identique', () => {
    const grid = createGrid();
    setPixel(grid, 2, 3, [10, 20, 30, 255]);

    expect(saveDraft(grid, KEY, 42)).toBe(true);
    expect(loadDraft(KEY)).toEqual(grid);
  });

  it('isole les brouillons par clé', () => {
    const first = createGrid();
    setPixel(first, 0, 0, [255, 0, 0, 255]);
    const second = createGrid();
    setPixel(second, 1, 1, [0, 0, 255, 255]);

    saveDraft(first, 'editor:a');
    saveDraft(second, 'editor:b');

    expect(loadDraft('editor:a')).toEqual(first);
    expect(loadDraft('editor:b')).toEqual(second);
    expect(loadDraft('editor:c')).toBeNull();
  });

  it('purge le brouillon', () => {
    const grid = createGrid();
    saveDraft(grid, KEY);
    clearDraft(KEY);
    expect(loadDraft(KEY)).toBeNull();
  });

  it('renvoie null si le JSON est corrompu', () => {
    localStorage.setItem(KEY, '{pas du json');
    expect(loadDraft(KEY)).toBeNull();
  });

  it('renvoie null si le contenu n’est pas un objet', () => {
    localStorage.setItem(KEY, '42');
    expect(loadDraft(KEY)).toBeNull();
  });

  it('renvoie null si la version de schéma diffère', () => {
    localStorage.setItem(KEY, storedDraft({ v: 999 }));
    expect(loadDraft(KEY)).toBeNull();
  });

  it('renvoie null si le champ grille est absent', () => {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, t: 1 }));
    expect(loadDraft(KEY)).toBeNull();
  });

  it('renvoie null si la grille encodée est invalide', () => {
    localStorage.setItem(KEY, storedDraft({ g: '!!!' }));
    expect(loadDraft(KEY)).toBeNull();
  });

  it('saveDraft renvoie false si l’écriture échoue (quota, mode privé)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(saveDraft(createGrid(), KEY)).toBe(false);
  });

  it('loadDraft renvoie null si la lecture échoue', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(loadDraft(KEY)).toBeNull();
  });

  it('clearDraft ne lève pas si la suppression échoue', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => clearDraft(KEY)).not.toThrow();
  });

  it('reste inerte quand localStorage est indisponible', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(isDraftStorageAvailable(KEY)).toBe(false);
    expect(saveDraft(createGrid(), KEY)).toBe(false);
    expect(loadDraft(KEY)).toBeNull();
    expect(() => clearDraft(KEY)).not.toThrow();
  });

  it('signale la disponibilité du stockage', () => {
    expect(isDraftStorageAvailable(KEY)).toBe(true);
    // La sonde ne doit pas laisser de trace.
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('isDraftStorageAvailable renvoie false si la sonde échoue', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('nope');
    });
    expect(isDraftStorageAvailable(KEY)).toBe(false);
  });
});
