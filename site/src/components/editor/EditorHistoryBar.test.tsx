import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import { EditorHistoryBar } from './EditorHistoryBar';

function renderBar(overrides: Partial<Parameters<typeof EditorHistoryBar>[0]> = {}) {
  const props = {
    canUndo: false,
    canRedo: false,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  };
  render(
    <I18nProvider defaultLocale="fr">
      <EditorHistoryBar {...props} />
    </I18nProvider>
  );
  return props;
}

describe('EditorHistoryBar', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  it('regroupe l’historique dans une barre étiquetée', () => {
    renderBar();
    expect(screen.getByRole('toolbar', { name: 'Historique' })).toBeInTheDocument();
    for (const label of ['Annuler', 'Rétablir', 'Effacer tout']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('désactive annuler/rétablir selon l’historique', () => {
    renderBar({ canUndo: false, canRedo: false });
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rétablir' })).toBeDisabled();
  });

  it('déclenche annuler/rétablir quand ils sont disponibles', () => {
    const { onUndo, onRedo } = renderBar({ canUndo: true, canRedo: true });

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rétablir' }));

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
  });

  it('déclenche l’effacement total', () => {
    const { onClear } = renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'Effacer tout' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
