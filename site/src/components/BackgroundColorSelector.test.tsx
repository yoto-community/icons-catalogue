import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { BackgroundColorSelector } from './BackgroundColorSelector';

function renderSelector(backgroundColor?: string) {
  const onChange = vi.fn();
  const utils = render(
    <I18nProvider defaultLocale="fr">
      <BackgroundColorSelector backgroundColor={backgroundColor} onChange={onChange} />
    </I18nProvider>
  );
  return { onChange, ...utils };
}

function optionButtons(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll<HTMLButtonElement>('.bg-color-option')];
}

describe('BackgroundColorSelector', () => {
  beforeEach(() => {
    localStorage.setItem('locale', 'fr');
  });

  it('est replié par défaut et affiche « Par défaut »', () => {
    const { container } = renderSelector();

    const toggle = container.querySelector('.bg-color-toggle');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.bg-color-panel')?.classList.contains('open')).toBe(false);
    expect(container.querySelector('.bg-color-toggle-value')?.textContent).toContain('Par défaut');
  });

  it('s’ouvre et se replie au clic sur le déclencheur', () => {
    const { container } = renderSelector();
    const toggle = container.querySelector<HTMLButtonElement>('.bg-color-toggle')!;

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(container.querySelector('.bg-color-panel')?.classList.contains('open')).toBe(true);

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('.bg-color-panel')?.classList.contains('open')).toBe(false);
  });

  it('remonte la couleur choisie puis se replie', () => {
    const { container, onChange } = renderSelector();
    const options = optionButtons(container);

    fireEvent.click(options[1]); // #1a1a2e

    expect(onChange).toHaveBeenCalledWith('#1a1a2e');
    expect(container.querySelector('.bg-color-panel')?.classList.contains('open')).toBe(false);
  });

  it('remonte `undefined` pour l’option « Par défaut »', () => {
    const { container, onChange } = renderSelector('#1a1a2e');
    const options = optionButtons(container);

    fireEvent.click(options[0]); // option par défaut

    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('marque l’option courante et affiche sa valeur', () => {
    const { container } = renderSelector('#e94560');

    expect(container.querySelector('.bg-color-toggle-value')?.textContent).toContain('#e94560');

    const selected = optionButtons(container).filter((b) => b.classList.contains('selected'));
    expect(selected).toHaveLength(1);
    expect(selected[0].querySelector('.bg-color-option-swatch')?.getAttribute('style')).toContain(
      'rgb(233, 69, 96)'
    );
    expect(selected[0].querySelector('.bg-color-option-check')).not.toBeNull();
  });

  it('se replie au clic en dehors du composant', () => {
    const { container } = renderSelector();
    const toggle = container.querySelector<HTMLButtonElement>('.bg-color-toggle')!;

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    fireEvent.mouseDown(document.body);

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
