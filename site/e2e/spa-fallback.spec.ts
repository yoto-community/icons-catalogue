import { test, expect, type Page } from '@playwright/test';
import { stubCatalogueData } from './helpers';

/**
 * E2E — repli SPA (P0.1).
 *
 * Sert la build de production avec un serveur qui imite GitHub Pages
 * (`e2e/serve-dist.mjs`) : aucune route inconnue ne reçoit `index.html`, elles
 * reçoivent **404 + le corps de `404.html`**. On vérifie qu'un accès direct à une
 * route profonde monte quand même l'application.
 *
 * `vite preview` (utilisé par les autres specs) ferait le repli lui-même et
 * masquerait toute régression.
 */

const FALLBACK_BASE = 'http://localhost:4174/icons-catalogue';

async function stubData(page: Page): Promise<void> {
  await stubCatalogueData(page);
}

test.describe('repli SPA (GitHub Pages)', () => {
  test('une route profonde rechargée directement sert l’application', async ({ page }) => {
    await stubData(page);

    const response = await page.goto(`${FALLBACK_BASE}/categories`);

    // GitHub Pages renvoie le statut 404 tout en servant le corps de 404.html.
    expect(response?.status()).toBe(404);

    // L'application s'hydrate et la route /categories est rendue.
    await expect(page.locator('.categories-page')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#categories-title')).toBeVisible();
  });

  test('une URL totalement inconnue sert aussi l’application', async ({ page }) => {
    await stubData(page);

    const response = await page.goto(`${FALLBACK_BASE}/chemin/inexistant`);
    expect(response?.status()).toBe(404);
    await expect(page.locator('.header')).toBeVisible({ timeout: 15_000 });
  });

  test('un fichier réellement présent est servi avec un statut 200', async ({ page }) => {
    // Pas d'interception : on teste bien le serveur statique.
    const response = await page.goto(`${FALLBACK_BASE}/summary.json`);
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('application/json');
  });
});
