import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { PixelGrid } from '../utils/pixelEditor';
import { createGrid, getPixel } from '../utils/pixelEditor';
import { usePixelEditor } from './usePixelEditor';

describe('usePixelEditor', () => {
  it('démarre sur une grille vide, sans historique', () => {
    const { result } = renderHook(() => usePixelEditor());

    expect(getPixel(result.current.state.grid, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('applique un coup, annule et rétablit', () => {
    const { result } = renderHook(() => usePixelEditor());

    act(() => {
      result.current.dispatch({ type: 'apply', x: 1, y: 2 });
    });
    expect(getPixel(result.current.state.grid, 1, 2)).toEqual(result.current.state.color);
    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.dispatch({ type: 'undo' });
    });
    expect(getPixel(result.current.state.grid, 1, 2)).toEqual([0, 0, 0, 0]);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.dispatch({ type: 'redo' });
    });
    expect(getPixel(result.current.state.grid, 1, 2)).toEqual(result.current.state.color);
  });

  it('part d’une grille initiale (modèle ou brouillon repris)', () => {
    const grid: PixelGrid = createGrid([255, 0, 0, 255]);
    const { result } = renderHook(() => usePixelEditor(grid));

    expect(getPixel(result.current.state.grid, 5, 5)).toEqual([255, 0, 0, 255]);
    expect(result.current.canUndo).toBe(false);
  });
});
