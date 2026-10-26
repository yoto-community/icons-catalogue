import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import { EDITOR_PALETTE } from '../../constants/editor';
import type { Rgba } from '../../utils/pixelEditor';
import { EditorPalette } from './EditorPalette';

const RED: Rgba = [233, 69, 96, 255];

function renderPalette(color: Rgba = [0, 0, 0, 255], onSelect = vi.fn()) {
  render(
    <I18nProvider defaultLocale="fr">
      <EditorPalette color={color} onSelect={onSelect} />
    </I18nProvider>
  );
  return { onSelect };
}

describe('EditorPalette', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  it('affiche une pastille par couleur de la palette', () => {
    renderPalette();
    expect(screen.getAllByRole('button')).toHaveLength(EDITOR_PALETTE.length);
  });

  it('nomme chaque pastille par son code hexadécimal (pas seulement la couleur)', () => {
    renderPalette();
    for (const hex of EDITOR_PALETTE) {
      expect(screen.getByRole('button', { name: hex })).toBeInTheDocument();
    }
  });

  it('signale la couleur active via aria-pressed', () => {
    renderPalette(RED);
    expect(screen.getByRole('button', { name: '#e94560' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '#000000' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('remonte la couleur RGBA au clic', () => {
    const { onSelect } = renderPalette();

    fireEvent.click(screen.getByRole('button', { name: '#e94560' }));

    expect(onSelect).toHaveBeenCalledWith(RED);
  });

  it('propose une couleur personnalisée accessible par son libellé', () => {
    const { onSelect } = renderPalette();

    const input = screen.getByLabelText('Couleur personnalisée');
    fireEvent.change(input, { target: { value: '#123456' } });

    expect(onSelect).toHaveBeenCalledWith([18, 52, 86, 255]);
  });

  it('conserve l’opacité courante quand on choisit une pastille', () => {
    const { onSelect } = renderPalette([233, 69, 96, 128]);

    fireEvent.click(screen.getByRole('button', { name: '#000000' }));

    expect(onSelect).toHaveBeenCalledWith([0, 0, 0, 128]);
  });

  it('conserve l’opacité courante via la couleur personnalisée', () => {
    const { onSelect } = renderPalette([233, 69, 96, 128]);

    const input = screen.getByLabelText('Couleur personnalisée');
    fireEvent.change(input, { target: { value: '#123456' } });

    expect(onSelect).toHaveBeenCalledWith([18, 52, 86, 128]);
  });

  it('marque la pastille active selon la teinte, quelle que soit l’opacité', () => {
    renderPalette([233, 69, 96, 128]);

    expect(screen.getByRole('button', { name: '#e94560' })).toHaveAttribute('aria-pressed', 'true');
  });
});
