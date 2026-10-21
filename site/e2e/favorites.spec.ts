import { test, expect } from '@playwright/test';
import { openCatalogue, PER_PAGE } from './helpers';

/**
 * E2E — favoris : bascule sur une carte, compteur d'en-tête, persistance
 * localStorage (clée `yoto-icons-favorites`), page /favorites, retrait.
 */

const FAV_KEY = 'yoto-icons-favorites';

test.describe('favoris', () => {
  test('ajout, compteur, persistance au rechargement, retrait sur /favorites', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    // Aucun favori au départ : pas de compteur dans l'en-tête.
    await expect(page.locator('header .nav-count')).toHaveCount(0);

    // Favoriter la première icône (bouton indépendant de la carte modale).
    const firstCard = page.locator('.icon-card').first();
    const firstTitle = (await firstCard.locator('.icon-title').textContent())?.trim() ?? '';
    const favButton = firstCard.locator('.favorite-btn');
    await favButton.click();
    await expect(favButton).toHaveAttribute('aria-pressed', 'true');

    // Compteur d'en-tête : 1 favori.
    await expect(page.locator('header .nav-count')).toHaveText('1');

    // Persistance : écrit dans localStorage.
    const stored = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '[]') as string[],
      FAV_KEY
    );
    expect(stored).toHaveLength(1);

    // Rechargement : le favori survit.
    await page.reload();
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);
    await expect(page.locator('.icon-card').first().locator('.favorite-btn')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.locator('header .nav-count')).toHaveText('1');

    // Page favoris : l'icône y figure avec son titre.
    await page.goto('/icons-catalogue/favorites');
    await expect(page.locator('#favorites-title')).toBeVisible();
    await expect(page.locator('.icon-card')).toHaveCount(1);
    await expect(page.locator('.icon-card .icon-title')).toHaveText(firstTitle);

    // Retrait depuis la page favoris : disparition + état vide.
    await page.locator('.icon-card .favorite-btn').click();
    await expect(page.locator('.icon-card')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('header .nav-count')).toHaveCount(0);

    // localStorage vidé en cohérence.
    const after = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? '[]') as string[],
      FAV_KEY
    );
    expect(after).toHaveLength(0);
  });

  test("le bouton favori n'ouvre pas la modale de détail (stopPropagation)", async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    await page.locator('.icon-card .favorite-btn').first().click();

    // Aucune modale ne s'ouvre : le clic ne remonte pas à la carte.
    await expect(page.locator('.modal-overlay')).toHaveCount(0);
    await expect(page.locator('.favorite-btn').first()).toHaveAttribute('aria-pressed', 'true');
  });
});
