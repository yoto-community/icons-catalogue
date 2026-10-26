import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../../i18n';
import { EditorImportPanel } from './EditorImportPanel';

function renderPanel(overrides: Partial<Parameters<typeof EditorImportPanel>[0]> = {}) {
  const onFile = vi.fn();
  const props = { isLoading: false, error: null as string | null, onFile, ...overrides };
  render(
    <I18nProvider defaultLocale="fr">
      <EditorImportPanel {...props} />
    </I18nProvider>
  );
  return { onFile };
}

describe('EditorImportPanel', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  it('est une section étiquetée avec un import de fichier', () => {
    renderPanel();
    expect(screen.getByRole('region', { name: 'Partir d’une icône' })).toBeInTheDocument();
    expect(screen.getByLabelText('Fichier image')).toHaveAttribute('accept', 'image/*');
  });

  it('remonte le fichier choisi', () => {
    const { onFile } = renderPanel();
    const file = new File(['x'], 'icone.png', { type: 'image/png' });

    fireEvent.change(screen.getByLabelText('Fichier image'), { target: { files: [file] } });

    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('ignore un changement sans fichier sélectionné', () => {
    const { onFile } = renderPanel();

    fireEvent.change(screen.getByLabelText('Fichier image'), { target: { files: [] } });

    expect(onFile).not.toHaveBeenCalled();
  });

  it('affiche l’erreur fournie et la signale', () => {
    renderPanel({ error: 'editor.import.errorFetch' });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Téléchargement impossible (le site source ne l’autorise pas).'
    );
  });

  it('signale un import en cours', () => {
    renderPanel({ isLoading: true });
    expect(screen.getByText('Import en cours…')).toBeInTheDocument();
  });
});
