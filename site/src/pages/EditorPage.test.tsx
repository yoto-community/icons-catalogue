import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n';
import { useImageImport, type UseImageImportResult } from '../hooks/useImageImport';
import { EditorPage } from './EditorPage';

// L'import est testé isolément ; on vérifie ici le seul rôle de la page :
// router l'URL éventuellement passée par la fiche d'icône vers l'éditeur.
vi.mock('../hooks/useImageImport', () => ({ useImageImport: vi.fn() }));

const importHook = vi.mocked(useImageImport);

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

function renderPage(entries: Parameters<typeof MemoryRouter>[0]['initialEntries'] = ['/editor']) {
  return render(
    <I18nProvider defaultLocale="fr">
      <MemoryRouter initialEntries={entries}>
        <EditorPage />
      </MemoryRouter>
    </I18nProvider>
  );
}

describe('EditorPage', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('locale', 'fr');
    mockImport();
  });

  it('affiche l’éditeur d’icônes', () => {
    renderPage();

    expect(screen.getByRole('heading', { name: 'Éditeur d’icônes' })).toBeInTheDocument();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Télécharger le PNG' })).toBeInTheDocument();
  });

  it('transmet à l’éditeur l’URL reçue via l’état de navigation (option B)', () => {
    const { importUrl } = mockImport();

    renderPage([
      { pathname: '/editor', state: { initialImageUrl: 'https://cdn.test/officielle.png' } },
    ]);

    expect(importUrl).toHaveBeenCalledWith('https://cdn.test/officielle.png');
  });
});
