import { test, expect } from '@playwright/test';
import { openCatalogue, TOTAL, PER_PAGE, MOON_COUNT, CAT_COUNT } from './helpers';

/**
 * E2E — flux de recherche du catalogue.
 *
 * Valide dans un VRAI navigateur ce que les tests unitaires ne couvrent pas :
 * le Web Worker construit réellement l'index Lunr, la requête tapée par
 * l'utilisateur traverse le debounce puis le worker, et la grille se filtre.
 */

test.describe('flux de recherche', () => {
  test('charge la grille paginée et signale le worker prêt', async ({ page }) => {
    await openCatalogue(page);

    // Page 1 : 48 des 60 icônes, avec pagination (2 pages).
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);
    await expect(page.locator('nav.pagination')).toBeVisible();

    // aria-busy="false" : le Web Worker a construit l'index (chemin réel,
    // pas le repli main-thread qui n'intervient qu'en cas de pan).
    await expect(page.locator('.results-section')).toHaveAttribute('aria-busy', 'false', {
      timeout: 10_000,
    });

    expect(TOTAL).toBe(60);
  });

  test('taper une requête filtre la grille via le worker', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    // Requête -> debounce (80 ms) -> worker -> grille filtrée.
    await page.locator('#search-input').fill('moon');
    await expect(page.locator('.icon-card')).toHaveCount(MOON_COUNT);

    // Intégrité : seules des icônes « moon » restent visibles.
    await expect(page.locator('.icon-card img[alt*="moon"]')).toHaveCount(MOON_COUNT);
    // Une seule page de résultats : la pagination disparaît.
    await expect(page.locator('nav.pagination')).toHaveCount(0);

    // Un autre terme : recherche full-text sur les tags (cat = 8).
    await page.locator('#search-input').fill('cat');
    await expect(page.locator('.icon-card')).toHaveCount(CAT_COUNT);

    // Vidage de la requête : la grille complète revient.
    await page.locator('#search-input').fill('');
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);
    await expect(page.locator('nav.pagination')).toBeVisible();
  });

  test("requête sans résultat affiche l'état vide avec la requête", async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    await page.locator('#search-input').fill('zzzzrien');

    await expect(page.locator('.icon-card')).toHaveCount(0);
    await expect(page.locator('.empty-state')).toBeVisible();
    // La requête est reprise dans le message (FR « … » ou EN "...").
    await expect(page.locator('.empty-state')).toContainText('zzzzrien');
  });

  test('la pagination déroule la seconde page (48 puis 12)', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    // Bouton « suivant » : structure [précédent, info, suivant] -> index 1.
    await page.locator('nav.pagination button').nth(1).click();

    await expect(page.locator('.icon-card')).toHaveCount(TOTAL - PER_PAGE);
    await expect(page.locator('nav.pagination .pagination-info')).toContainText('2');
  });
});
