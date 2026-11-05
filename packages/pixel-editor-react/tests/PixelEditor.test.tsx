import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import {
  DRAFT_STORAGE_KEY,
  createGrid,
  saveDraft,
  setPixel,
  type PixelGrid,
} from '@yoto-community/pixel-editor-core';
import { useImageImport, type UseImageImportResult } from '../src/useImageImport';
import { PixelEditor } from '../src/PixelEditor';
import { createTranslator, en, fr } from '../src/messages';

// Le hook d'import est testé isolément (`useImageImport.test.ts`) : on le
// remplace ici par un double pour vérifier uniquement le câblage de l'éditeur.
vi.mock('../src/useImageImport', () => ({ useImageImport: vi.fn() }));

const importHook = vi.mocked(useImageImport);

/** Installe un double du hook d'import ; renvoie ses fonctions pour assertions. */
function mockImport(overrides: Partial<UseImageImportResult> = {}): UseImageImportResult {
  const value: UseImageImportResult = {
    isLoading: false,
    error: null,
    importBlob: vi.fn(async () => null),
    importUrl: vi.fn(async () => null),
    ...overrides,
  };
  importHook.mockReturnValue(value);
  return value;
}

type EditorProps = Parameters<typeof PixelEditor>[0];

function renderEditor(props: Partial<EditorProps> = {}) {
  return render(<PixelEditor messages={fr} {...props} />);
}

function firstCell() {
  return screen.getByRole('gridcell', { name: /Ligne 1, colonne 1,/ });
}

function redGrid(): PixelGrid {
  const grid = createGrid();
  setPixel(grid, 0, 0, [255, 0, 0, 255]);
  return grid;
}

describe('PixelEditor', () => {
  beforeEach(() => {
    localStorage.clear();
    mockImport();
  });
  afterEach(() => vi.restoreAllMocks());

  it('présente le titre, le sous-titre et les zones de travail', () => {
    renderEditor();
    expect(screen.getByRole('heading', { name: 'Éditeur d’icônes' })).toBeInTheDocument();
    expect(
      screen.getByText('Dessinez une icône 16×16 pour le Yoto Player, puis téléchargez-la en PNG.')
    ).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Outils de dessin' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Aperçu de l’icône' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('place les outils de dessin et la palette dans un panneau latéral gauche', () => {
    renderEditor();

    const panel = screen.getByRole('complementary', { name: 'Panneau des outils' });
    expect(within(panel).getByRole('toolbar', { name: 'Outils de dessin' })).toBeInTheDocument();
    expect(within(panel).getByRole('group', { name: 'Palette de couleurs' })).toBeInTheDocument();
    // La grille et l'aperçu restent hors du panneau (centre et droite).
    expect(within(panel).queryByRole('grid')).not.toBeInTheDocument();
    expect(
      within(panel).queryByRole('region', { name: 'Aperçu de l’icône' })
    ).not.toBeInTheDocument();
    // Annuler/Rétablir/Effacer tout restent en haut, hors du panneau.
    expect(within(panel).queryByRole('button', { name: 'Annuler' })).not.toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: 'Effacer tout' })).not.toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Historique' })).toBeInTheDocument();
  });

  it('désactive le téléchargement tant que l’icône est vide, puis l’active', () => {
    renderEditor();
    const download = screen.getByRole('button', { name: 'Télécharger le PNG' });
    expect(download).toBeDisabled();

    fireEvent.keyDown(firstCell(), { key: 'Enter' });

    expect(download).toBeEnabled();
  });

  it('télécharge le PNG via un lien de téléchargement', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderEditor();
    fireEvent.keyDown(firstCell(), { key: 'Enter' });

    fireEvent.click(screen.getByRole('button', { name: 'Télécharger le PNG' }));

    expect(click).toHaveBeenCalledTimes(1);
  });

  it('met à jour l’état quand un pixel est peint au clavier', () => {
    renderEditor();
    expect(screen.getByText('Icône vide : aucun pixel dessiné.')).toBeInTheDocument();

    fireEvent.keyDown(firstCell(), { key: 'Enter' });

    expect(screen.getByText('1 couleur')).toBeInTheDocument();
  });

  it('sélectionne l’outil via un raccourci clavier', () => {
    renderEditor();

    fireEvent.keyDown(firstCell(), { key: 'g' });

    expect(screen.getByRole('button', { name: 'Gomme' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('sélectionne une couleur de la palette via un chiffre', () => {
    renderEditor();

    fireEvent.keyDown(firstCell(), { key: '2' });

    expect(screen.getByRole('button', { name: '#ffffff' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('annule avec Ctrl+Z', () => {
    renderEditor();
    fireEvent.keyDown(firstCell(), { key: 'Enter' });
    expect(screen.getByText('1 couleur')).toBeInTheDocument();

    fireEvent.keyDown(firstCell(), { key: 'z', ctrlKey: true });

    expect(screen.getByText('Icône vide : aucun pixel dessiné.')).toBeInTheDocument();
  });

  it('repart d’une icône vierge avec « Nouvelle icône »', () => {
    renderEditor();
    fireEvent.keyDown(firstCell(), { key: 'Enter' });

    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle icône' }));

    expect(screen.getByText('Icône vide : aucun pixel dessiné.')).toBeInTheDocument();
  });

  it('restaure un brouillon et permet de le reprendre à zéro', () => {
    const grid = redGrid();
    saveDraft(grid, DRAFT_STORAGE_KEY);

    renderEditor();

    const banner = screen.getByText('Brouillon restauré.').closest('div') as HTMLElement;
    expect(screen.getByText('1 couleur')).toBeInTheDocument();

    fireEvent.click(within(banner).getByRole('button', { name: 'Repartir de zéro' }));

    expect(screen.queryByText('Brouillon restauré.')).not.toBeInTheDocument();
    expect(screen.getByText('Icône vide : aucun pixel dessiné.')).toBeInTheDocument();
  });

  it('lit et purge le brouillon sous la clé fournie', () => {
    const grid = redGrid();
    saveDraft(grid, 'mon-editeur:test');

    renderEditor({ storageKey: 'mon-editeur:test' });
    expect(screen.getByText('1 couleur')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Repartir de zéro' }));

    expect(localStorage.getItem('mon-editeur:test')).toBeNull();
  });
});

describe('PixelEditor — i18n', () => {
  beforeEach(() => {
    localStorage.clear();
    mockImport();
  });
  afterEach(() => vi.restoreAllMocks());

  it('utilise l’anglais par défaut', () => {
    render(<PixelEditor />);
    expect(screen.getByRole('heading', { name: 'Icon editor' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download PNG' })).toBeInTheDocument();
  });

  it('accepte un dictionnaire de messages', () => {
    render(<PixelEditor messages={en} />);
    expect(screen.getByText('Empty icon: no pixel drawn.')).toBeInTheDocument();
  });

  it('accepte un traducteur de l’hôte, prioritaire sur les messages', () => {
    const t = createTranslator({ 'editor.title': 'Titre personnalisé' });
    render(<PixelEditor t={t} messages={fr} />);
    expect(screen.getByRole('heading', { name: 'Titre personnalisé' })).toBeInTheDocument();
  });
});

describe('PixelEditor — actions et intégration', () => {
  beforeEach(() => {
    localStorage.clear();
    mockImport();
  });
  afterEach(() => vi.restoreAllMocks());

  it('hides the download action in compact mode', () => {
    render(<PixelEditor compact />);
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new icon/i })).not.toBeInTheDocument();
  });

  it('garde les actions hors mode compact', () => {
    render(<PixelEditor />);
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new icon/i })).toBeInTheDocument();
  });

  it('masque les actions quand showActions vaut false', () => {
    render(<PixelEditor showActions={false} />);
    expect(screen.queryByRole('button', { name: /download/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new icon/i })).not.toBeInTheDocument();
  });

  it('notifie les changements de grille via onChange', () => {
    const onChange = vi.fn();
    render(<PixelEditor onChange={onChange} />);
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole('gridcell', { name: /Row 1, column 1,/ }), { key: 'Enter' });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][3]).toBe(255);
  });

  it('délègue l’export à onExport au lieu de télécharger', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const onExport = vi.fn();
    render(<PixelEditor onExport={onExport} />);

    fireEvent.keyDown(screen.getByRole('gridcell', { name: /Row 1, column 1,/ }), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Download PNG' }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onExport.mock.calls[0][0]).toMatch(/^data:image\/png;base64,/);
    expect(click).not.toHaveBeenCalled();
  });
});

describe('PixelEditor — partir d’une icône (L4)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockImport();
  });
  afterEach(() => vi.restoreAllMocks());

  it('affiche le panneau d’import', () => {
    renderEditor();
    expect(screen.getByRole('region', { name: 'Partir d’une icône' })).toBeInTheDocument();
  });

  it('décode un fichier local et charge la grille obtenue', async () => {
    const { importBlob } = mockImport({ importBlob: vi.fn(async () => redGrid()) });
    renderEditor();
    const file = new File(['x'], 'icone.png', { type: 'image/png' });

    fireEvent.change(screen.getByLabelText('Fichier image'), { target: { files: [file] } });

    expect(importBlob).toHaveBeenCalledWith(file);
    await waitFor(() => expect(screen.getByText('1 couleur')).toBeInTheDocument());
  });

  it('importe l’image initiale fournie par la fiche (option B)', async () => {
    const { importUrl } = mockImport({ importUrl: vi.fn(async () => redGrid()) });

    renderEditor({ initialImageUrl: 'https://exemple.test/officielle.png' });

    expect(importUrl).toHaveBeenCalledWith('https://exemple.test/officielle.png');
    await waitFor(() => expect(screen.getByText('1 couleur')).toBeInTheDocument());
  });

  it('affiche l’erreur d’import renvoyée par le hook', () => {
    mockImport({ error: 'editor.import.errorFetch' });
    renderEditor();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Téléchargement impossible (le site source ne l’autorise pas).'
    );
  });

  it('signale un import en cours', () => {
    mockImport({ isLoading: true });
    renderEditor();
    expect(screen.getByText('Import en cours…')).toBeInTheDocument();
  });
});
