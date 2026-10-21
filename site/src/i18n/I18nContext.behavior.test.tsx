import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { I18nProvider, useI18n } from './I18nContext';

/**
 * Comportement de base du provider i18n : interpolations, pluriels
 * conditionnels, clés manquantes, changement de langue et garde-fou
 * d'usage hors provider. Les traductions sont embarquées (aucun fetch).
 */

function MissingKeyProbe() {
  const { t, tRich } = useI18n();
  return (
    <div>
      <span data-testid="missing-plain">{t('cle.inexistante')}</span>
      <span data-testid="missing-rich">{tRich('autre.cle.inexistante')}</span>
    </div>
  );
}

function LocaleProbe() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="count">{t('common.iconsCount', { count: 2 })}</span>
      <button type="button" onClick={() => setLocale('en')}>
        switch
      </button>
    </div>
  );
}

describe('i18n — comportement du provider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    document.documentElement.lang = '';
    // jsdom expose 'en-US' par défaut : on force le français pour des
    // assertions déterministes (le provider lit `navigator.language`).
    Object.defineProperty(navigator, 'language', { value: 'fr-FR', configurable: true });
  });

  it('t() renvoie la clé et avertit quand la traduction est absente', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(
      <I18nProvider defaultLocale="fr">
        <MissingKeyProbe />
      </I18nProvider>
    );
    expect(screen.getByTestId('missing-plain').textContent).toBe('cle.inexistante');
    expect(screen.getByTestId('missing-rich').textContent).toBe('autre.cle.inexistante');
    expect(warn).toHaveBeenCalledWith('Translation missing for key: cle.inexistante');
    expect(warn).toHaveBeenCalledWith('Translation missing for key: autre.cle.inexistante');
  });

  it('résout les pluriels conditionnels', () => {
    render(
      <I18nProvider defaultLocale="fr">
        <LocaleProbe />
      </I18nProvider>
    );
    expect(screen.getByTestId('count').textContent).toBe('2 icônes');
  });

  it('change de langue, la persiste et met à jour <html lang>', () => {
    render(
      <I18nProvider defaultLocale="fr">
        <LocaleProbe />
      </I18nProvider>
    );
    expect(screen.getByTestId('locale').textContent).toBe('fr');

    act(() => {
      screen.getByRole('button', { name: 'switch' }).click();
    });

    expect(screen.getByTestId('locale').textContent).toBe('en');
    expect(localStorage.getItem('locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('relit la langue depuis localStorage au démarrage', () => {
    localStorage.setItem('locale', 'en');
    render(
      <I18nProvider defaultLocale="fr">
        <LocaleProbe />
      </I18nProvider>
    );
    expect(screen.getByTestId('locale').textContent).toBe('en');
  });

  it('useI18n lève une erreur en dehors du provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<MissingKeyProbe />)).toThrow(
      'useI18n must be used within an I18nProvider'
    );
    spy.mockRestore();
  });
});
