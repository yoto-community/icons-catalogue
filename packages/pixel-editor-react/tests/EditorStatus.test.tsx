import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { createGrid, setPixel, type Rgba } from '@yoto-community/pixel-editor-core';
import { EditorStatus } from '../src/EditorStatus';
import { renderFr } from './helpers';

const COLORS: Rgba[] = [
  [255, 0, 0, 255],
  [0, 255, 0, 255],
  [0, 0, 255, 255],
  [255, 255, 0, 255],
  [255, 0, 255, 255],
  [0, 255, 255, 255],
  [128, 0, 0, 255],
  [0, 128, 0, 255],
  [0, 0, 128, 255],
];

function renderStatus(grid = createGrid()) {
  renderFr(<EditorStatus grid={grid} />);
}

describe('EditorStatus', () => {
  it('est une zone de statut annoncée poliment', () => {
    renderStatus();
    const status = screen.getByRole('status', { name: 'État de l’icône' });
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('signale une icône vide', () => {
    renderStatus();
    expect(screen.getByText('Icône vide : aucun pixel dessiné.')).toBeInTheDocument();
  });

  it('compte les couleurs au singulier et au pluriel', () => {
    const one = createGrid();
    setPixel(one, 0, 0, COLORS[0]);
    renderStatus(one);
    expect(screen.getByText('1 couleur')).toBeInTheDocument();
  });

  it('accorde le pluriel au-delà d’une couleur', () => {
    const grid = createGrid();
    setPixel(grid, 0, 0, COLORS[0]);
    setPixel(grid, 1, 0, COLORS[1]);
    renderStatus(grid);
    expect(screen.getByText('2 couleurs')).toBeInTheDocument();
  });

  it('avertit de la présence de noir pur', () => {
    const grid = createGrid();
    setPixel(grid, 0, 0, [0, 0, 0, 255]);
    renderStatus(grid);
    expect(
      screen.getByText('Noir pur détecté : invisible sur le fond noir du Player.')
    ).toBeInTheDocument();
  });

  it('avertit au-delà de 8 couleurs', () => {
    const grid = createGrid();
    COLORS.forEach((color, index) => setPixel(grid, index, 0, color));
    renderStatus(grid);
    expect(screen.getByText('9 couleurs')).toBeInTheDocument();
    expect(
      screen.getByText('Plus de 8 couleurs : le rendu peut manquer de lisibilité.')
    ).toBeInTheDocument();
  });
});
