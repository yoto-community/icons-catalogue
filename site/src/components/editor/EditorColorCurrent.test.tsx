import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import type { Rgba } from '../../utils/pixelEditor';
import { EditorColorCurrent } from './EditorColorCurrent';

const RED: Rgba = [233, 69, 96, 255];
const RED_HALF: Rgba = [233, 69, 96, 128];

function renderCurrent(color: Rgba = RED, onSelect = vi.fn()) {
  render(
    <I18nProvider defaultLocale="fr">
      <EditorColorCurrent color={color} onSelect={onSelect} />
    </I18nProvider>
  );
  return { onSelect };
}

describe('EditorColorCurrent', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

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
