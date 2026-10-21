import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Icon } from '../types';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

const icon: Icon = {
  id: 'a',
  source: 'yotoicons',
  tags: [],
  artist: '@alice',
  title: 'Chat',
  preview_image: 'p.png',
  download_url: 'd.png',
  category: 'animaux',
  subcategory: 'chat',
  downloads: 0,
  date_added: '2024-01-01T00:00:00.000Z',
};

function makeInput(id: string): HTMLInputElement {
  const input = document.createElement('input');
  input.id = id;
  input.type = 'text';
  document.body.appendChild(input);
  return input;
}

function press(key: string, init: KeyboardEventInit = {}, target: EventTarget = document) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('« / » focus et sélectionne la barre de recherche', () => {
    const input = makeInput('search-input');
    input.value = 'abc';
    renderHook(() => useKeyboardShortcuts({ selectedIcon: null, closeIconDetail: vi.fn() }));

    const event = press('/');

    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(3);
  });

  it('« / » respecte un identifiant de recherche personnalisé', () => {
    const input = makeInput('ma-recherche');
    renderHook(() =>
      useKeyboardShortcuts({
        selectedIcon: null,
        closeIconDetail: vi.fn(),
        searchInputId: 'ma-recherche',
      })
    );

    press('/');
    expect(document.activeElement).toBe(input);
  });

  it('« / » est ignoré pendant la saisie dans un champ', () => {
    makeInput('search-input');
    const other = makeInput('autre');
    other.focus();
    renderHook(() => useKeyboardShortcuts({ selectedIcon: null, closeIconDetail: vi.fn() }));

    press('/', {}, other);

    expect(document.activeElement).toBe(other);
  });

  it('« / » est ignoré avec les modificateurs ctrl/meta/alt', () => {
    const input = makeInput('search-input');
    renderHook(() => useKeyboardShortcuts({ selectedIcon: null, closeIconDetail: vi.fn() }));

    for (const mod of ['ctrlKey', 'metaKey', 'altKey'] as const) {
      press('/', { [mod]: true });
      expect(document.activeElement).not.toBe(input);
    }
  });

  it('« Échap » ferme le détail quand une icône est sélectionnée', () => {
    const closeIconDetail = vi.fn();
    renderHook(() => useKeyboardShortcuts({ selectedIcon: icon, closeIconDetail }));

    press('Escape');

    expect(closeIconDetail).toHaveBeenCalledTimes(1);
  });

  it('« Échap » retire le focus de la recherche sans détail ouvert', () => {
    const input = makeInput('search-input');
    input.focus();
    const closeIconDetail = vi.fn();
    renderHook(() => useKeyboardShortcuts({ selectedIcon: null, closeIconDetail }));

    press('Escape');

    expect(closeIconDetail).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(input);
  });

  it('« Échap » sans champ ciblé ne fait rien', () => {
    const closeIconDetail = vi.fn();
    renderHook(() => useKeyboardShortcuts({ selectedIcon: null, closeIconDetail }));

    expect(() => press('Escape')).not.toThrow();
    expect(closeIconDetail).not.toHaveBeenCalled();
  });

  it('ignore les touches non concernées', () => {
    const input = makeInput('search-input');
    renderHook(() => useKeyboardShortcuts({ selectedIcon: null, closeIconDetail: vi.fn() }));

    press('a');
    press('Enter');

    expect(document.activeElement).not.toBe(input);
  });

  it('retire son écouteur au démontage', () => {
    const closeIconDetail = vi.fn();
    const { unmount } = renderHook(() =>
      useKeyboardShortcuts({ selectedIcon: icon, closeIconDetail })
    );

    unmount();
    press('Escape');

    expect(closeIconDetail).not.toHaveBeenCalled();
  });
});
