import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  AUTOSAVE_DELAY_MS,
  createGrid,
  loadDraft,
  saveDraft,
  setPixel,
} from '@yoto-community/pixel-editor-core';
import { useEditorDraft } from '../src/useEditorDraft';

/** Clé de brouillon utilisée par tous les cas de ce fichier. */
const KEY = 'test:use-editor-draft';

describe('useEditorDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('signale l’absence de brouillon', () => {
    const { result } = renderHook(() => useEditorDraft(null, undefined, KEY));
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.restoredDraft).toBeNull();
  });

  it('relit le brouillon existant au montage', () => {
    const grid = createGrid();
    setPixel(grid, 0, 0, [255, 0, 0, 255]);
    saveDraft(grid, KEY);

    const { result } = renderHook(() => useEditorDraft(null, undefined, KEY));
    expect(result.current.hasDraft).toBe(true);
    expect(result.current.restoredDraft).toEqual(grid);
  });

  it('ignore les brouillons stockés sous une autre clé', () => {
    const grid = createGrid();
    setPixel(grid, 0, 0, [255, 0, 0, 255]);
    saveDraft(grid, 'autre-editeur');

    const { result } = renderHook(() => useEditorDraft(null, undefined, KEY));
    expect(result.current.hasDraft).toBe(false);
  });

  it('auto-sauvegarde la grille après le délai, sous la clé fournie', () => {
    const grid = createGrid();
    setPixel(grid, 1, 1, [0, 0, 255, 255]);
    renderHook(() => useEditorDraft(grid, undefined, KEY));

    expect(localStorage.getItem(KEY)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    });
    expect(localStorage.getItem(KEY)).not.toBeNull();
    expect(loadDraft(KEY)).toEqual(grid);
  });

  it('ne sauvegarde pas avant le délai', () => {
    renderHook(() => useEditorDraft(createGrid(), undefined, KEY));
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1);
    });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('ne sauvegarde pas une grille nulle', () => {
    renderHook(() => useEditorDraft(null, undefined, KEY));
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);
    });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('resauvegarde la dernière grille quand elle change', () => {
    const first = createGrid();
    const second = createGrid([0, 255, 0, 255]);

    const { rerender } = renderHook(({ grid }) => useEditorDraft(grid, undefined, KEY), {
      initialProps: { grid: first },
    });
    rerender({ grid: second });
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    });

    expect(loadDraft(KEY)).toEqual(second);
  });

  it('n’enregistre pas une grille vide', () => {
    renderHook(() => useEditorDraft(createGrid(), undefined, KEY));
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);
    });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('purge le brouillon et l’état via clear()', () => {
    const grid = createGrid();
    saveDraft(grid, KEY);

    const { result } = renderHook(() => useEditorDraft(null, undefined, KEY));
    act(() => {
      result.current.clear();
    });

    expect(result.current.hasDraft).toBe(false);
    expect(result.current.restoredDraft).toBeNull();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
