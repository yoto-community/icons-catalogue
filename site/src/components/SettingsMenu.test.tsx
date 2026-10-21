import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { SettingsMenu } from './SettingsMenu';

function renderMenu() {
  return render(
    <I18nProvider defaultLocale="fr">
      <SettingsMenu />
    </I18nProvider>
  );
}

describe('SettingsMenu', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('locale', 'fr');
    document.documentElement.lang = 'fr';
    document.documentElement.removeAttribute('data-theme');
  });

  it('expose un bouton « Réglages » replié par défaut', () => {
    renderMenu();

    const toggle = screen.getByRole('button', { name: 'Réglages' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAttribute('aria-haspopup', 'true');
  });

  it('regroupe le sélecteur de langue et de thème dans le panneau', () => {
    renderMenu();

    expect(screen.getByRole('combobox', { name: 'Changer de langue' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Changer de thème' })).toBeInTheDocument();
  });

  it('ouvre puis referme le panneau au clic sur le bouton', () => {
    const { container } = renderMenu();
    const toggle = screen.getByRole('button', { name: 'Réglages' });
    const panel = container.querySelector('.settings-panel');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel?.classList.contains('is-open')).toBe(true);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel?.classList.contains('is-open')).toBe(false);
  });

  it('referme le panneau lors d’un clic à l’extérieur', () => {
    renderMenu();
    const toggle = screen.getByRole('button', { name: 'Réglages' });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.pointerDown(document.body);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('ne referme pas le panneau lors d’un clic à l’intérieur', () => {
    renderMenu();
    const toggle = screen.getByRole('button', { name: 'Réglages' });

    fireEvent.click(toggle);
    fireEvent.pointerDown(screen.getByRole('combobox', { name: 'Changer de langue' }));

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('ferme le panneau avec Échap et rend le focus au bouton', () => {
    renderMenu();
    const toggle = screen.getByRole('button', { name: 'Réglages' });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  it('ignore les autres touches du clavier', () => {
    renderMenu();
    const toggle = screen.getByRole('button', { name: 'Réglages' });

    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: 'Enter' });

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
