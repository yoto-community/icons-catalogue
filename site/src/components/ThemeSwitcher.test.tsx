import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { ThemeSwitcher } from './ThemeSwitcher';

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(
      () =>
        ({
          matches,
          media: '(prefers-color-scheme: dark)',
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList
    )
  );
}

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('locale', 'fr');
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => vi.unstubAllGlobals());

  it('propose les trois modes, « Système » par défaut', () => {
    stubMatchMedia(false);
    render(
      <I18nProvider defaultLocale="fr">
        <ThemeSwitcher />
      </I18nProvider>
    );

    const select = screen.getByRole('combobox', { name: 'Changer de thème' });
    expect(select).toHaveValue('system');
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('applique et persiste le thème choisi', () => {
    stubMatchMedia(false);
    render(
      <I18nProvider defaultLocale="fr">
        <ThemeSwitcher />
      </I18nProvider>
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dark' } });

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('yoto-icons-theme')).toBe('dark');
  });
});
