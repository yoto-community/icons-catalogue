import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { CodeBlock, COPIED_FEEDBACK_MS } from './CodeBlock';

function renderBlock(code = 'const a = 1;') {
  return render(
    <I18nProvider defaultLocale="fr">
      <CodeBlock title="Exemple" code={code} language="javascript" />
    </I18nProvider>
  );
}

function stubClipboard(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
});

// jsdom expose `navigator.language = "en-US"`, ce qui fait basculer le
// provider sur l'anglais : on force le français pour vérifier les libellés.
beforeEach(() => {
  localStorage.setItem('locale', 'fr');
});

describe('CodeBlock', () => {
  it('affiche le titre et le code', () => {
    renderBlock();
    expect(screen.getByText('Exemple')).toBeInTheDocument();
    expect(screen.getByText('const a = 1;')).toBeInTheDocument();
  });

  it("n'interprète pas le HTML présent dans le code", () => {
    const { container } = renderBlock('<b>pas du gras</b>');
    expect(screen.getByText('<b>pas du gras</b>')).toBeInTheDocument();
    expect(container.querySelector('b')).toBeNull();
  });

  it('copie le code et affiche une confirmation temporaire', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboard(writeText);

    renderBlock('const b = 2;');
    fireEvent.click(screen.getByRole('button'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledWith('const b = 2;');
    expect(screen.getByRole('button')).toHaveTextContent('Copié !');

    act(() => {
      vi.advanceTimersByTime(COPIED_FEEDBACK_MS);
    });
    expect(screen.getByRole('button')).toHaveTextContent('Copier');
  });

  it('reste inerte si le presse-papiers est indisponible', () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    renderBlock();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveTextContent('Copier');
  });

  it('ne plante pas si la copie est refusée', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('refusé'));
    stubClipboard(writeText);

    renderBlock();
    fireEvent.click(screen.getByRole('button'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalled();
    expect(screen.getByRole('button')).toHaveTextContent('Copier');
  });
});
