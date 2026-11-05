import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import type { Rgba } from '@yoto-community/pixel-editor-core';
import { EditorColorCurrent } from '../src/EditorColorCurrent';
import { renderFr } from './helpers';

const RED: Rgba = [233, 69, 96, 255];
const RED_HALF: Rgba = [233, 69, 96, 128];

function renderCurrent(color: Rgba = RED, onSelect = vi.fn()) {
  renderFr(<EditorColorCurrent color={color} onSelect={onSelect} />);
  return { onSelect };
}

describe('EditorColorCurrent', () => {
  it('affiche la couleur courante et son opacité', () => {
    renderCurrent(RED_HALF);

    expect(screen.getByRole('group', { name: 'Couleur courante' })).toBeInTheDocument();
    expect(screen.getByText('50 %')).toBeInTheDocument();
  });

  it('expose un curseur d’opacité à 100 % pour une couleur opaque', () => {
    renderCurrent(RED);

    const slider = screen.getByRole('slider', { name: 'Opacité' });
    expect(slider).toHaveValue('100');
    expect(slider).toHaveAttribute('aria-valuetext', '100 %');
  });

  it('reflète l’alpha de la couleur active', () => {
    renderCurrent(RED_HALF);

    expect(screen.getByRole('slider', { name: 'Opacité' })).toHaveValue('50');
  });

  it('remonte la couleur avec le nouvel alpha quand on règle l’opacité', () => {
    const { onSelect } = renderCurrent(RED);

    fireEvent.change(screen.getByRole('slider', { name: 'Opacité' }), { target: { value: '50' } });

    expect(onSelect).toHaveBeenCalledWith(RED_HALF);
  });
});
