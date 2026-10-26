import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DRAFT_STORAGE_KEY } from '../constants/editor';
import { createGrid, setPixel } from './pixelEditor';
import { clearDraft, isDraftStorageAvailable, loadDraft, saveDraft } from './editorStorage';

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
    expect(loadDraft()).toBeNull();
  });

  it('enregistre puis relit la grille à l’identique', () => {
    const grid = createGrid();
    setPixel(grid, 2, 3, [10, 20, 30, 255]);

    expect(saveDraft(grid, 42)).toBe(true);
    expect(loadDraft()).toEqual(grid);
  });

  it('purge le brouillon', () => {
    const grid = createGrid();
    saveDraft(grid);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it('renvoie null si le JSON est corrompu', () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, '{pas du json');
    expect(loadDraft()).toBeNull();
  });

  it('renvoie null si le contenu n’est pas un objet', () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, '42');
    expect(loadDraft()).toBeNull();
  });

  it('renvoie null si la version de schéma diffère', () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, storedDraft({ v: 999 }));
    expect(loadDraft()).toBeNull();
  });

  it('renvoie null si le champ grille est absent', () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ v: 1, t: 1 }));
    expect(loadDraft()).toBeNull();
  });

  it('renvoie null si la grille encodée est invalide', () => {
    localStorage.setItem(DRAFT_STORAGE_KEY, storedDraft({ g: '!!!' }));
    expect(loadDraft()).toBeNull();
  });

  it('saveDraft renvoie false si l’écriture échoue (quota, mode privé)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(saveDraft(createGrid())).toBe(false);
  });

  it('loadDraft renvoie null si la lecture échoue', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(loadDraft()).toBeNull();
  });

  it('clearDraft ne lève pas si la suppression échoue', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => clearDraft()).not.toThrow();
  });

  it('reste inerte quand localStorage est indisponible', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(isDraftStorageAvailable()).toBe(false);
    expect(saveDraft(createGrid())).toBe(false);
    expect(loadDraft()).toBeNull();
    expect(() => clearDraft()).not.toThrow();
  });

  it('signale la disponibilité du stockage', () => {
    expect(isDraftStorageAvailable()).toBe(true);
    // La sonde ne doit pas laisser de trace.
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('isDraftStorageAvailable renvoie false si la sonde échoue', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('nope');
    });
    expect(isDraftStorageAvailable()).toBe(false);
  });
});
