import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AUTOSAVE_DELAY_MS, DRAFT_STORAGE_KEY } from '../constants/editor';
import { createGrid, setPixel } from '../utils/pixelEditor';
import { saveDraft, loadDraft } from '../utils/editorStorage';
import { useEditorDraft } from './useEditorDraft';

describe('useEditorDraft', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('signale l’absence de brouillon', () => {
    const { result } = renderHook(() => useEditorDraft(null));
    expect(result.current.hasDraft).toBe(false);
    expect(result.current.restoredDraft).toBeNull();
  });

  it('relit le brouillon existant au montage', () => {
    const grid = createGrid();
    setPixel(grid, 0, 0, [255, 0, 0, 255]);
    saveDraft(grid);

    const { result } = renderHook(() => useEditorDraft(null));
    expect(result.current.hasDraft).toBe(true);
    expect(result.current.restoredDraft).toEqual(grid);
  });

  it('auto-sauvegarde la grille après le délai', () => {
    const grid = createGrid();
    setPixel(grid, 1, 1, [0, 0, 255, 255]);
    renderHook(() => useEditorDraft(grid));

    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    });
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).not.toBeNull();
  });

  it('ne sauvegarde pas avant le délai', () => {
    renderHook(() => useEditorDraft(createGrid()));
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DELAY_MS - 1);
    });
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('ne sauvegarde pas une grille nulle', () => {
    renderHook(() => useEditorDraft(null));
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);
    });
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('resauvegarde la dernière grille quand elle change', () => {
    const first = createGrid();
    const second = createGrid([0, 255, 0, 255]);

    const { rerender } = renderHook(({ grid }) => useEditorDraft(grid), {
      initialProps: { grid: first },
    });
    rerender({ grid: second });
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DELAY_MS);
    });

    expect(loadDraft()).toEqual(second);
  });

  it('n’enregistre pas une grille vide', () => {
    renderHook(() => useEditorDraft(createGrid()));
    act(() => {
      vi.advanceTimersByTime(AUTOSAVE_DELAY_MS * 2);
    });
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it('purge le brouillon et l’état via clear()', () => {
    const grid = createGrid();
    saveDraft(grid);

    const { result } = renderHook(() => useEditorDraft(null));
    act(() => {
      result.current.clear();
    });

    expect(result.current.hasDraft).toBe(false);
    expect(result.current.restoredDraft).toBeNull();
    expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });
});
