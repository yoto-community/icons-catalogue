import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider, useI18n } from './I18nContext';

/**
 * Test de sécurité : l'échappement des paramètres dans tRich.
 * `tRich` injecte du HTML via dangerouslySetInnerHTML — toute valeur
 * interpolée doit être échappée pour empêcher une injection XSS.
 */
function Probe({ params }: { params?: Record<string, string | number> }) {
  const { tRich, t } = useI18n();
  return (
    <div>
      <span data-testid="rich">{tRich('modal.byArtist', params)}</span>
      <span data-testid="plain">{t('modal.byArtist', params)}</span>
    </div>
  );
}

function renderProbe(params?: Record<string, string | number>) {
  return render(
    <I18nProvider defaultLocale="fr">
      <Probe params={params} />
    </I18nProvider>
  );
}

describe('i18n — sécurité de tRich', () => {
  beforeAll(() => {
    // Les traductions sont embarquées ; on masque les éventuels warnings de
    // clé manquante pour garder la sortie de test lisible.
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  it('rend le HTML légitime des traductions (balises non échappées)', () => {
    renderProbe({ artist: 'sylvain' });
    // "byArtist" contient <strong>@{{artist}}</strong>
    const rich = screen.getByTestId('rich');
    expect(rich.querySelector('strong')).not.toBeNull();
    expect(rich.textContent).toContain('sylvain');
  });

  it('ÉCHAPPE les balises injectées via un paramètre (anti-XSS)', () => {
    renderProbe({ artist: '<img src=x onerror=alert(1)>' });
    const rich = screen.getByTestId('rich');

    // Aucune balise image ne doit être créée à partir du paramètre.
    expect(rich.querySelector('img')).toBeNull();
    // Le texte doit contenir la valeur échappée, non interprétée.
    expect(rich.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('neutralise un script injecté via un paramètre', () => {
    renderProbe({ artist: '<script>alert("xss")</script>' });
    const rich = screen.getByTestId('rich');
    expect(rich.querySelector('script')).toBeNull();
    expect(rich.textContent).toContain('<script>');
  });

  it("n'exécute pas de handler on* injecté", () => {
    renderProbe({ artist: '" onmouseover="alert(1)' });
    const rich = screen.getByTestId('rich');
    expect(rich.querySelector('[onmouseover]')).toBeNull();
  });

  it('conserve les nombres tels quels (pluriels conditionnels)', () => {
    renderProbe({ artist: 42 });
    expect(screen.getByTestId('rich').textContent).toContain('42');
  });

  it('la variante t() (texte brut) ne rend jamais de HTML', () => {
    renderProbe({ artist: '<b>gras</b>' });
    const plain = screen.getByTestId('plain');
    expect(plain.querySelector('b')).toBeNull();
    expect(plain.textContent).toContain('<b>gras</b>');
  });
});
