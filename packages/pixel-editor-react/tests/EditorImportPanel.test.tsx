import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { EditorImportPanel } from '../src/EditorImportPanel';
import { renderFr } from './helpers';

function renderPanel(overrides: Partial<Parameters<typeof EditorImportPanel>[0]> = {}) {
  const onFile = vi.fn();
  const props = { isLoading: false, error: null as string | null, onFile, ...overrides };
  renderFr(<EditorImportPanel {...props} />);
  return { onFile };
}

describe('EditorImportPanel', () => {
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
