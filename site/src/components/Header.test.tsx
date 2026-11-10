import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n';
import { FavoritesProvider } from '../context/FavoritesContext';
import { Header } from './Header';

const FAV_KEY = 'yoto-icons-favorites';

function renderHeader(path = '/') {
  return render(
    <I18nProvider defaultLocale="fr">
      <FavoritesProvider>
        <MemoryRouter initialEntries={[path]}>
          <Header />
        </MemoryRouter>
      </FavoritesProvider>
    </I18nProvider>
  );
}

describe('Header', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('locale', 'fr');
  });

  it('affiche la navigation principale et le menu « Réglages » sur une seule barre', () => {
    const { container } = renderHeader();

    expect(container.querySelectorAll('.yc-header__inner')).toHaveLength(1);
    expect(container.querySelector('.app-bar')).toBeNull();
    expect(screen.getByRole('link', { name: 'Yoto Community' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Catégories' })).toHaveAttribute('href', '/categories');
    expect(screen.getByRole('button', { name: 'Réglages' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Changer de langue' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Changer de thème' })).toBeInTheDocument();
  });

  it('regroupe la navigation locale dans le menu mobile', () => {
    const { container } = renderHeader();
    const toggle = screen.getByRole('button', { name: 'Menu' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(container.querySelector('#mobile-nav')).toBeNull();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    const mobileNav = container.querySelector('#mobile-nav') as HTMLElement;
    expect(mobileNav).not.toBeNull();
    expect(mobileNav.querySelector('a[href="/categories"]')).not.toBeNull();
  });

  it('marque le lien courant comme actif', () => {
    renderHeader('/categories');

    const link = screen.getByRole('link', { name: 'Catégories' });
    expect(link.classList.contains('is-active')).toBe(true);
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('ouvre et referme le menu communauté', () => {
    renderHeader();
    const toggle = screen.getByRole('button', { name: 'Communauté' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('menuitem', { name: 'Auteurs' }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('expose un lien vers la page des sources dans le menu communauté', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Communauté' }));
    expect(screen.getByRole('menuitem', { name: 'Sources' })).toHaveAttribute('href', '/sources');
  });

  it('expose le portail et l’annuaire de podcasts dans la barre communauté, sans nouvel onglet', () => {
    renderHeader();

    const portal = screen.getByRole('link', { name: /Awesome Yoto/ });
    expect(portal).toHaveAttribute('href', 'https://yoto-community.github.io/fr/');
    expect(portal).not.toHaveAttribute('target');

    const podcasts = screen.getByRole('link', { name: /Annuaire de podcasts/ });
    expect(podcasts).toHaveAttribute(
      'href',
      'https://yoto-community.github.io/podcast-catalogue/fr/'
    );
    expect(podcasts).not.toHaveAttribute('target');

    const icons = screen.getByRole('link', { name: /Catalogue d’icônes/ });
    expect(icons).toHaveAttribute('href', '/');
    expect(icons).toHaveAttribute('aria-current', 'page');
  });

  it('garde la contribution et le dépôt GitHub dans le menu communauté', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Communauté' }));

    expect(screen.getByRole('menuitem', { name: /Contribuer/ })).toHaveAttribute(
      'href',
      'https://github.com/yoto-community/icons-catalogue/blob/main/CONTRIBUTING.md'
    );
    expect(screen.getByRole('menuitem', { name: /GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/yoto-community/icons-catalogue'
    );
  });

  it('ne duplique pas les sites frères dans le menu communauté', () => {
    renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Communauté' }));

    expect(screen.queryByRole('menuitem', { name: /Awesome Yoto/ })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /Annuaire de podcasts/ })).toBeNull();
  });

  it('affiche le compteur de favoris quand il est non nul', () => {
    localStorage.setItem(FAV_KEY, JSON.stringify(['a', 'b']));
    const { container } = renderHeader();

    expect(container.querySelector('.nav-count')?.textContent).toBe('2');
  });

  it('masque le compteur de favoris quand il est vide', () => {
    const { container } = renderHeader();
    expect(container.querySelector('.nav-count')).toBeNull();
  });

  it('expose un lien vers l’éditeur d’icônes', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: 'Éditeur' })).toHaveAttribute('href', '/editor');
  });

  it('utilise les URL anglaises quand la locale est en', () => {
    localStorage.setItem('locale', 'en');
    renderHeader();

    expect(screen.getByRole('link', { name: /Awesome Yoto/ })).toHaveAttribute(
      'href',
      'https://yoto-community.github.io/'
    );
    expect(screen.getByRole('link', { name: /Podcast directory/ })).toHaveAttribute(
      'href',
      'https://yoto-community.github.io/podcast-catalogue/en/'
    );
  });

  it('marque le lien favoris comme actif', () => {
    renderHeader('/favorites');

    const link = screen.getByRole('link', { name: 'Favoris' });
    expect(link.classList.contains('is-active')).toBe(true);
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('referme le menu communauté après un clic sur un lien externe', () => {
    renderHeader();
    const toggle = screen.getByRole('button', { name: 'Communauté' });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('menuitem', { name: /Contribuer/ }));
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  it('referme le menu mobile après un clic sur chaque lien', () => {
    const { container } = renderHeader('/favorites');
    const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const selectors = [
      '.mobile-group--ecosystem a[href="https://yoto-community.github.io/fr/"]',
      '.mobile-group--ecosystem a[href="/"]',
      '.mobile-group--ecosystem a[href*="podcast-catalogue"]',
      '.mobile-nav-list a[href="/categories"]',
      '.mobile-nav-list a[href="/favorites"]',
      '.mobile-group:not(.mobile-group--ecosystem) a[href="/sources"]',
      '.mobile-group:not(.mobile-group--ecosystem) a[href*="CONTRIBUTING"]',
    ];

    for (const selector of selectors) {
      openMenu();
      const panel = container.querySelector('#mobile-nav') as HTMLElement;
      const link = panel.querySelector(selector) as HTMLElement;
      expect(link).not.toBeNull();
      // jsdom ne gère pas la navigation document : on neutralise l'action par défaut.
      link.addEventListener('click', (event) => event.preventDefault(), { once: true });

      fireEvent.click(link);
      expect(container.querySelector('#mobile-nav')).toBeNull();
    }
  });

  it('marque le lien communauté courant comme actif dans le menu mobile', () => {
    const { container } = renderHeader('/sources');
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const link = container.querySelector('#mobile-nav a[href="/sources"]') as HTMLElement;
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('affiche le compteur de favoris dans le menu mobile', () => {
    localStorage.setItem(FAV_KEY, JSON.stringify(['a', 'b']));
    const { container } = renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    const mobileNav = container.querySelector('#mobile-nav') as HTMLElement;
    expect(mobileNav.querySelector('.nav-count')?.textContent).toBe('2');
  });
});
