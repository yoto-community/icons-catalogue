import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import { GRID_SIZE } from '../../constants/editor';
import { createGrid, setPixel, type EditorTool, type PixelGrid } from '../../utils/pixelEditor';
import { PixelGridEditor } from './PixelGridEditor';

function renderGrid(
  grid: PixelGrid = createGrid(),
  onPaint = vi.fn(),
  tool: EditorTool = 'pencil'
) {
  render(
    <I18nProvider defaultLocale="fr">
      <PixelGridEditor grid={grid} onPaint={onPaint} tool={tool} />
    </I18nProvider>
  );
  return { onPaint };
}

/** Cellule pointée par ses coordonnées 1-indexées affichées dans son libellé. */
function cellAt(row: number, col: number) {
  return screen.getByRole('gridcell', {
    name: new RegExp(`Ligne ${row}, colonne ${col},`),
  });
}

describe('PixelGridEditor', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  it('expose une grille ARIA de 16 lignes × 16 cellules', () => {
    renderGrid();

    const grid = screen.getByRole('grid', { name: 'Grille de dessin 16 × 16' });
    expect(grid).toHaveAttribute('aria-rowcount', String(GRID_SIZE));
    expect(grid).toHaveAttribute('aria-colcount', String(GRID_SIZE));
    expect(screen.getAllByRole('row')).toHaveLength(GRID_SIZE);
    expect(screen.getAllByRole('gridcell')).toHaveLength(GRID_SIZE * GRID_SIZE);
  });

  it('applique un roving tabindex : une seule cellule focusable', () => {
    renderGrid();

    const reachable = screen
      .getAllByRole('gridcell')
      .filter((cell) => cell.getAttribute('tabindex') === '0');
    expect(reachable).toHaveLength(1);
    expect(reachable[0]).toBe(cellAt(1, 1));
  });

  it('libelle chaque cellule par ses coordonnées et sa couleur', () => {
    const grid = createGrid();
    setPixel(grid, 0, 0, [255, 0, 0, 255]);
    renderGrid(grid);

    expect(
      screen.getByRole('gridcell', { name: 'Ligne 1, colonne 1, #ff0000' })
    ).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: 'Ligne 1, colonne 2, vide' })).toBeInTheDocument();
  });

  it('déplace le focus à la flèche et déplace le tabindex', () => {
    renderGrid();
    const first = cellAt(1, 1);
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowRight' });

    const next = cellAt(1, 2);
    expect(next).toHaveAttribute('tabindex', '0');
    expect(document.activeElement).toBe(next);
  });

  it('boucle aux bords', () => {
    renderGrid();
    const first = cellAt(1, 1);
    first.focus();

    fireEvent.keyDown(first, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(cellAt(1, GRID_SIZE));
  });

  it('peint la cellule courante avec Entrée ou Espace', () => {
    const { onPaint } = renderGrid();
    const first = cellAt(1, 1);

    fireEvent.keyDown(first, { key: 'Enter' });
    fireEvent.keyDown(first, { key: ' ' });

    expect(onPaint).toHaveBeenNthCalledWith(1, 0, 0);
    expect(onPaint).toHaveBeenNthCalledWith(2, 0, 0);
  });

  it('ignore une touche non gérée (ni peinture, ni déplacement)', () => {
    const { onPaint } = renderGrid();
    const first = cellAt(1, 1);
    first.focus();

    fireEvent.keyDown(first, { key: 'a' });

    expect(onPaint).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(first);
  });

  it('reflète l’outil actif pour le curseur (data-tool)', () => {
    renderGrid(createGrid(), vi.fn(), 'eraser');

    expect(screen.getByRole('grid')).toHaveAttribute('data-tool', 'eraser');
  });

  it('peint au clic sur une cellule', () => {
    const { onPaint } = renderGrid();

    fireEvent.pointerDown(cellAt(3, 4));

    expect(onPaint).toHaveBeenCalledWith(3, 2);
  });

  it('peint en glissant sur des cellules voisines, jusqu’au relâchement', () => {
    const { onPaint } = renderGrid();

    fireEvent.pointerDown(cellAt(1, 1));
    fireEvent.pointerOver(cellAt(1, 2));
    fireEvent.pointerUp(screen.getByRole('grid'));
    fireEvent.pointerOver(cellAt(1, 3));

    expect(onPaint).toHaveBeenCalledTimes(2);
    expect(onPaint).toHaveBeenNthCalledWith(1, 0, 0);
    expect(onPaint).toHaveBeenNthCalledWith(2, 1, 0);
  });
});
