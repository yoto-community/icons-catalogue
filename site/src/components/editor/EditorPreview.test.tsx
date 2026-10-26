import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import { createGrid, setPixel } from '../../utils/pixelEditor';
import { EditorPreview } from './EditorPreview';

function renderPreview(grid = createGrid()) {
  return render(
    <I18nProvider defaultLocale="fr">
      <EditorPreview grid={grid} />
    </I18nProvider>
  );
}

describe('EditorPreview', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

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
    rerender(
      <I18nProvider defaultLocale="fr">
        <EditorPreview grid={grid} />
      </I18nProvider>
    );

    const after = screen.getByRole('img', { name: 'Aperçu' }).getAttribute('src');
    expect(after).toMatch(/^data:image\/png;base64,/);
    expect(after).not.toBe(before);
  });
});
