import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n';
import { Footer } from './Footer';

function renderFooter() {
  return render(
    <I18nProvider defaultLocale="fr">
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    </I18nProvider>
  );
}

describe('Footer', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('locale', 'fr');
  });

  it('renvoie vers le portail communautaire et le guide MYO', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'communauté Yoto' })).toHaveAttribute(
      'href',
      'https://yoto-community.github.io/'
    );
    expect(screen.getByRole('link', { name: 'créez votre première carte MYO' })).toHaveAttribute(
      'href',
      'https://yoto-community.github.io/myo/'
    );
  });

  it('expose un lien « Soutenir le projet » vers le parrainage GitHub', () => {
    renderFooter();

    expect(screen.getByRole('link', { name: 'Soutenir le projet' })).toHaveAttribute(
      'href',
      'https://github.com/sponsors/yoto-community'
    );
    expect(screen.getByRole('link', { name: 'Soutenir le projet' })).toHaveAttribute(
      'target',
      '_blank'
    );
  });
});
