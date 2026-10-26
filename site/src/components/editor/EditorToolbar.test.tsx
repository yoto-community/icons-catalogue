import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import { EditorToolbar } from './EditorToolbar';

function renderToolbar(overrides: Partial<Parameters<typeof EditorToolbar>[0]> = {}) {
  const props = {
    tool: 'pencil' as const,
    onToolChange: vi.fn(),
    ...overrides,
  };
  render(
    <I18nProvider defaultLocale="fr">
      <EditorToolbar {...props} />
    </I18nProvider>
  );
  return props;
}

describe('EditorToolbar', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  it('regroupe les outils de dessin dans une barre étiquetée', () => {
    renderToolbar();
    expect(screen.getByRole('toolbar', { name: 'Outils de dessin' })).toBeInTheDocument();
    for (const label of ['Crayon', 'Gomme', 'Remplissage', 'Pipette']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('signale l’outil actif via aria-pressed', () => {
    renderToolbar({ tool: 'fill' });
    expect(screen.getByRole('button', { name: 'Remplissage' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: 'Crayon' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('remonte le changement d’outil', () => {
    const { onToolChange } = renderToolbar();

    fireEvent.click(screen.getByRole('button', { name: 'Gomme' }));

    expect(onToolChange).toHaveBeenCalledWith('eraser');
  });
});
