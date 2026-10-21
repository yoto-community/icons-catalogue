import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HighlightedText } from './HighlightedText';

describe('HighlightedText', () => {
  it('affiche le texte sans balise quand aucune requête n’est fournie', () => {
    const { container } = render(<HighlightedText text="Un chat" />);
    expect(container.textContent).toBe('Un chat');
    expect(container.querySelector('mark')).toBeNull();
  });

  it('entoure les termes correspondants d’un <mark>', () => {
    const { container } = render(<HighlightedText text="Un chat noir" query="chat" />);
    const mark = container.querySelector('mark');
    expect(mark?.textContent).toBe('chat');
    expect(container.textContent).toBe('Un chat noir');
  });

  it('surligne plusieurs termes', () => {
    render(<HighlightedText text="un chat noir" query="chat noir" />);
    expect(screen.getAllByText(/chat|noir/, { selector: 'mark' })).toHaveLength(2);
  });

  it('ne surligne rien quand le terme est absent', () => {
    const { container } = render(<HighlightedText text="Un chat" query="chien" />);
    expect(container.querySelector('mark')).toBeNull();
  });
});
