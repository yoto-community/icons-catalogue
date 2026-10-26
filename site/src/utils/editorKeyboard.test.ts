import { describe, it, expect } from 'vitest';
import { GRID_SIZE } from '../constants/editor';
import {
  isActivationKey,
  moveFocus,
  paletteIndexForShortcut,
  toolForShortcut,
  type FocusPosition,
} from './editorKeyboard';

const at = (x: number, y: number): FocusPosition => ({ x, y });

describe('moveFocus', () => {
  it('déplace d’une cellule dans chaque direction', () => {
    expect(moveFocus(at(4, 4), 'ArrowRight')).toEqual(at(5, 4));
    expect(moveFocus(at(4, 4), 'ArrowLeft')).toEqual(at(3, 4));
    expect(moveFocus(at(4, 4), 'ArrowDown')).toEqual(at(4, 5));
    expect(moveFocus(at(4, 4), 'ArrowUp')).toEqual(at(4, 3));
  });

  it('boucle d’un bord à l’autre (horizontal et vertical)', () => {
    expect(moveFocus(at(0, 0), 'ArrowLeft')).toEqual(at(GRID_SIZE - 1, 0));
    expect(moveFocus(at(GRID_SIZE - 1, 0), 'ArrowRight')).toEqual(at(0, 0));
    expect(moveFocus(at(0, 0), 'ArrowUp')).toEqual(at(0, GRID_SIZE - 1));
    expect(moveFocus(at(0, GRID_SIZE - 1), 'ArrowDown')).toEqual(at(0, 0));
  });

  it('renvoie la même position (identité) pour une touche non gérée', () => {
    const position = at(2, 3);
    expect(moveFocus(position, 'Enter')).toBe(position);
    expect(moveFocus(position, 'a')).toBe(position);
  });
});

describe('isActivationKey', () => {
  it('reconnaît Entrée et Espace', () => {
    expect(isActivationKey('Enter')).toBe(true);
    expect(isActivationKey(' ')).toBe(true);
    expect(isActivationKey('Spacebar')).toBe(true);
  });

  it('rejette les autres touches', () => {
    expect(isActivationKey('ArrowUp')).toBe(false);
    expect(isActivationKey('a')).toBe(false);
  });
});

describe('toolForShortcut', () => {
  it('associe les lettres aux outils, sans tenir compte de la casse', () => {
    expect(toolForShortcut('p')).toBe('pencil');
    expect(toolForShortcut('P')).toBe('pencil');
    expect(toolForShortcut('g')).toBe('eraser');
    expect(toolForShortcut('f')).toBe('fill');
    expect(toolForShortcut('b')).toBe('picker');
  });

  it('renvoie null pour les touches non associées', () => {
    expect(toolForShortcut('x')).toBeNull();
    expect(toolForShortcut('1')).toBeNull();
    expect(toolForShortcut('')).toBeNull();
  });
});

describe('paletteIndexForShortcut', () => {
  it('associe les chiffres 1–9 à un index de palette', () => {
    expect(paletteIndexForShortcut('1')).toBe(0);
    expect(paletteIndexForShortcut('5')).toBe(4);
    expect(paletteIndexForShortcut('9')).toBe(8);
  });

  it('renvoie null hors de la plage (0 et au-delà de 9)', () => {
    expect(paletteIndexForShortcut('0')).toBeNull();
    expect(paletteIndexForShortcut('a')).toBeNull();
    expect(paletteIndexForShortcut('')).toBeNull();
  });
});
