import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '../i18n';
import { ErrorState } from './ErrorState';

function renderWithI18n(ui: React.ReactNode) {
  return render(<I18nProvider defaultLocale="fr">{ui}</I18nProvider>);
}

describe('ErrorState', () => {
  // Locale forcée pour des assertions déterministes (jsdom annonce en-US).
  beforeEach(() => localStorage.setItem('locale', 'fr'));

  it('affiche un état d’alerte avec un message traduit', () => {
    renderWithI18n(<ErrorState onRetry={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent(/chargement/i);
    // Pas de clé i18n brute affichée à l'utilisateur.
    expect(screen.getByRole('alert').textContent).not.toMatch(/errorState\./);
  });

  it('appelle onRetry au clic sur Réessayer', () => {
    const onRetry = vi.fn();
    renderWithI18n(<ErrorState onRetry={onRetry} />);

    screen.getByRole('button', { name: /réessayer/i }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
