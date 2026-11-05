import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, within } from '@testing-library/react';
import { mountPixelEditor } from '../src/index';
import { fr } from '../src/messages';

describe('mountPixelEditor', () => {
  let host: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    host.remove();
    vi.restoreAllMocks();
  });

  it('monte l’éditeur dans l’élément fourni', () => {
    act(() => {
      mountPixelEditor(host, { messages: fr });
    });

    expect(within(host).getByRole('heading', { name: 'Éditeur d’icônes' })).toBeInTheDocument();
    expect(within(host).getByRole('grid')).toBeInTheDocument();
  });

  it('renvoie une fonction de démontage qui vide l’élément', () => {
    let unmount: () => void = () => {};
    act(() => {
      unmount = mountPixelEditor(host, { messages: fr });
    });

    act(() => unmount());

    expect(host).toBeEmptyDOMElement();
  });

  it('accepte les props de l’éditeur (mode compact)', () => {
    act(() => {
      mountPixelEditor(host, { messages: fr, compact: true });
    });

    expect(within(host).queryByRole('button', { name: 'Télécharger le PNG' })).toBeNull();
  });
});
