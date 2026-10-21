import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { ErrorBoundary } from './ErrorBoundary';

function renderWithI18n(ui: React.ReactNode) {
  return render(<I18nProvider defaultLocale="fr">{ui}</I18nProvider>);
}

function Boom(): React.ReactElement {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  it('rend les enfants en l’absence d’erreur', () => {
    renderWithI18n(
      <ErrorBoundary>
        <p>contenu</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('contenu')).toBeInTheDocument();
  });

  it('affiche un repli quand un enfant lève une erreur de rendu', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithI18n(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
