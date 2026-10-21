import { describe, it, expect } from 'vitest';
import { splitHighlight } from './highlight';

describe('splitHighlight', () => {
  it('renvoie le texte entier sans correspondance quand la requête est vide', () => {
    expect(splitHighlight('Un chat noir', '')).toEqual([{ text: 'Un chat noir', match: false }]);
    expect(splitHighlight('Un chat noir', '   ')).toEqual([{ text: 'Un chat noir', match: false }]);
  });

  it('marque une correspondance simple en conservant la casse d’origine', () => {
    expect(splitHighlight('Un Chat noir', 'chat')).toEqual([
      { text: 'Un ', match: false },
      { text: 'Chat', match: true },
      { text: ' noir', match: false },
    ]);
  });

  it('gère un terme en début et en fin de texte', () => {
    expect(splitHighlight('chat', 'chat')).toEqual([{ text: 'chat', match: true }]);
  });

  it('gère plusieurs occurrences', () => {
    expect(splitHighlight('chat puis chat', 'chat')).toEqual([
      { text: 'chat', match: true },
      { text: ' puis ', match: false },
      { text: 'chat', match: true },
    ]);
  });

  it('gère plusieurs termes séparés par des espaces', () => {
    expect(splitHighlight('un chat noir', 'chat noir')).toEqual([
      { text: 'un ', match: false },
      { text: 'chat', match: true },
      { text: ' ', match: false },
      { text: 'noir', match: true },
    ]);
  });

  it('traite les caractères spéciaux de regex littéralement', () => {
    expect(splitHighlight('a+b', 'a+b')).toEqual([{ text: 'a+b', match: true }]);
    expect(splitHighlight('x.y', 'x.y')).toEqual([{ text: 'x.y', match: true }]);
    expect(splitHighlight('c++ 16', 'c++')).toEqual([
      { text: 'c++', match: true },
      { text: ' 16', match: false },
    ]);
  });

  it('renvoie une seule part quand aucun terme ne correspond', () => {
    expect(splitHighlight('Un chat', 'chien')).toEqual([{ text: 'Un chat', match: false }]);
  });

  it('gère un texte vide', () => {
    expect(splitHighlight('', 'chat')).toEqual([{ text: '', match: false }]);
  });
});
