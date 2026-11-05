import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { createGrid, setPixel } from '@yoto-community/pixel-editor-core';
import { EditorPreview } from '../src/EditorPreview';
import { renderFr, withFr } from './helpers';

function renderPreview(grid = createGrid()) {
  return renderFr(<EditorPreview grid={grid} />);
}

describe('EditorPreview', () => {
  it('expose une région étiquetée', () => {
    renderPreview();
    expect(screen.getByRole('region', { name: 'Aperçu de l’icône' })).toBeInTheDocument();
  });

  it('affiche l’icône sous forme de data URL PNG', () => {
    renderPreview();
    const image = screen.getByRole('img', { name: 'Aperçu' });
    expect(image.getAttribute('src')).toMatch(/^data:image\/png;base64,/);
  });

  it('reflete la grille fournie (le PNG change quand un pixel est peint)', () => {
    const { rerender } = renderPreview();
    const before = screen.getByRole('img', { name: 'Aperçu' }).getAttribute('src');

    const grid = createGrid();
    setPixel(grid, 0, 0, [255, 0, 0, 255]);
    rerender(withFr(<EditorPreview grid={grid} />));

    const after = screen.getByRole('img', { name: 'Aperçu' }).getAttribute('src');
    expect(after).toMatch(/^data:image\/png;base64,/);
    expect(after).not.toBe(before);
  });
});
