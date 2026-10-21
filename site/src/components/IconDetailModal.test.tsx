import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useState } from 'react';
import type { Icon } from '../types';
import { I18nProvider } from '../i18n';
import { IconDetailModal } from './IconDetailModal';

function makeIcon(overrides: Partial<Icon> = {}): Icon {
  return {
    id: 'yi-alice-1',
    source: 'yotoicons',
    tags: ['chat'],
    artist: '@alice',
    title: 'Un chat',
    preview_image: 'https://example.com/1.png',
    download_url: 'https://example.com/1.png',
    category: 'animaux',
    subcategory: 'chat',
    downloads: 42,
    date_added: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderModal(icon: Icon) {
  const onClose = vi.fn();
  const onDownload = vi.fn();
  const view = render(
    <I18nProvider defaultLocale="fr">
      <MemoryRouter>
        <IconDetailModal icon={icon} onClose={onClose} onDownload={onDownload} />
      </MemoryRouter>
    </I18nProvider>
  );
  return { onClose, onDownload, ...view };
}

describe('IconDetailModal', () => {
  // jsdom expose `navigator.language = "en-US"` : on force le français.
  beforeEach(() => {
    localStorage.setItem('locale', 'fr');
  });

  it("expose l'auteur comme lien vers sa page", () => {
    renderModal(makeIcon());
    expect(screen.getByRole('link', { name: '@alice' })).toHaveAttribute(
      'href',
      '/authors/%40alice'
    );
  });

  it("ferme la modale quand on clique sur le nom de l'auteur", () => {
    const { onClose } = renderModal(makeIcon());
    fireEvent.click(screen.getByRole('link', { name: '@alice' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("n'affiche pas de lien auteur quand l'auteur est absent", () => {
    const { container } = renderModal(makeIcon({ artist: '' }));
    expect(container.querySelector('.modal-artist-link')).toBeNull();
  });
});

describe('IconDetailModal — gestion du focus (P3.4)', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  function Harness() {
    const [icon, setIcon] = useState<Icon | null>(null);
    return (
      <I18nProvider defaultLocale="fr">
        <MemoryRouter>
          <button type="button" onClick={() => setIcon(makeIcon())}>
            Ouvrir le détail
          </button>
          <IconDetailModal icon={icon} onClose={() => setIcon(null)} onDownload={() => {}} />
        </MemoryRouter>
      </I18nProvider>
    );
  }

  it('place le focus dans la modale à l’ouverture et le restaure à la fermeture', () => {
    render(<Harness />);

    const trigger = screen.getByRole('button', { name: 'Ouvrir le détail' });
    trigger.focus();
    fireEvent.click(trigger);

    const closeButton = screen.getByRole('button', { name: 'Fermer les détails' });
    expect(document.activeElement).toBe(closeButton);

    fireEvent.click(closeButton);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });
});
