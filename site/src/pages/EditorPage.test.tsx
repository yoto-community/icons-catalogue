import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type * as PixelEditorReact from '@yoto-community/pixel-editor-react';
import { en, fr, type PixelEditorProps } from '@yoto-community/pixel-editor-react';
import { I18nProvider } from '../i18n';
import { EditorPage } from './EditorPage';

// L'éditeur lui-même est testé dans son paquet ; la page ne fait que le câbler.
// On l'espionne donc pour vérifier les props transmises (locale, brouillon,
// option B) sans dépendre de son rendu interne.
const { receivedProps } = vi.hoisted(() => ({ receivedProps: [] as PixelEditorProps[] }));

vi.mock('@yoto-community/pixel-editor-react', async (importOriginal) => {
  const actual = await importOriginal<typeof PixelEditorReact>();
  return {
    ...actual,
    PixelEditor: (props: PixelEditorProps) => {
      receivedProps.push(props);
      return null;
    },
  };
});

function renderPage(
  entries: Parameters<typeof MemoryRouter>[0]['initialEntries'] = ['/editor'],
  locale: 'fr' | 'en' = 'fr'
) {
  localStorage.setItem('locale', locale);
  return render(
    <I18nProvider defaultLocale={locale}>
      <MemoryRouter initialEntries={entries}>
        <EditorPage />
      </MemoryRouter>
    </I18nProvider>
  );
}

describe('EditorPage', () => {
  beforeEach(() => {
    receivedProps.length = 0;
    localStorage.clear();
  });

  it('transmet au paquet les messages de la locale du catalogue', () => {
    const { container, unmount } = renderPage(['/editor'], 'fr');

    expect(receivedProps[receivedProps.length - 1]?.messages).toBe(fr);
    // Le conteneur porte le thème du site (mapping des jetons `--pe-*`).
    expect(container.querySelector('.pe-theme-yoto')).toBeInTheDocument();

    unmount();
    receivedProps.length = 0;
    renderPage(['/editor'], 'en');
    expect(receivedProps[receivedProps.length - 1]?.messages).toBe(en);
  });

  it('conserve la clé de brouillon historique', () => {
    renderPage();

    expect(receivedProps[receivedProps.length - 1]?.storageKey).toBe('yoto-icons-editor-draft');
  });

  it('transmet à l’éditeur l’URL reçue via l’état de navigation (option B)', () => {
    renderPage([
      { pathname: '/editor', state: { initialImageUrl: 'https://cdn.test/officielle.png' } },
    ]);

    expect(receivedProps[receivedProps.length - 1]?.initialImageUrl).toBe(
      'https://cdn.test/officielle.png'
    );
  });
});
