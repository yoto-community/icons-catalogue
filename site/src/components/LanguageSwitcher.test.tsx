import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('locale', 'fr');
    document.documentElement.lang = 'fr';
  });

  it('affiche la langue courante et les deux options', () => {
    render(
      <I18nProvider defaultLocale="fr">
        <LanguageSwitcher />
      </I18nProvider>
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('fr');
    expect(screen.getAllByRole('option')).toHaveLength(2);
  });

  it('change la langue au changement de sélection', () => {
    render(
      <I18nProvider defaultLocale="fr">
        <LanguageSwitcher />
      </I18nProvider>
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'en' } });

    expect(screen.getByRole('combobox')).toHaveValue('en');
    expect(localStorage.getItem('locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });
});
