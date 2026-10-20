import { test, expect } from '@playwright/test';
import {
  openCatalogue,
  PER_PAGE,
  MOON_COUNT,
  NATURE_COUNT,
  ANIMALS_COUNT,
  LUNE_COUNT,
} from './helpers';

/**
 * E2E — filtres de la page d'accueil : catégorie (nature = 32 icônes),
 * sous-catégorie (lune = 12), tri par titre, réinitialisation.
 *
 * La fixture : nature = lunes + arbres + soleils (12 + 10 + 10 = 32).
 * Tri par défaut (téléchargements décroissants) : « sunny day 10 » en tête.
 */

test.describe('filtres', () => {
  test('filtrage catégorie puis sous-catégorie', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    // Catégorie nature : 32 icônes, et le filtre de sous-catégorie apparaît.
    await page.locator('#category-filter').selectOption('nature');
    await expect(page.locator('.icon-card')).toHaveCount(NATURE_COUNT);
    await expect(page.locator('#subcategory-filter')).toBeVisible();
    // 3 sous-catégories + « toutes » = 4 options.
    await expect(page.locator('#subcategory-filter option')).toHaveCount(4);

    // Sous-catégorie lune : 12 icônes (lunettes de la fixture : moon).
    await page.locator('#subcategory-filter').selectOption('lune');
    await expect(page.locator('.icon-card')).toHaveCount(LUNE_COUNT);
    await expect(page.locator('.icon-card img[alt*="moon"]')).toHaveCount(LUNE_COUNT);
    // Seule la recherche « moon » donne le même compte : mêmes icônes.
    expect(MOON_COUNT).toBe(LUNE_COUNT);
  });

  test('tri par titre : première carte « bunny 01 »', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    // Défaut : téléchargements décroissants -> « sunny day 10 » (fixture).
    await expect(page.locator('.icon-card .icon-title').first()).toHaveText('sunny day 10');

    await page.locator('#sort-filter').selectOption('title');
    await expect(page.locator('.icon-card .icon-title').first()).toHaveText('bunny 01');
  });

  test('le bouton réinitialiser apparaît puis remet à zéro', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    // Pas de réinitialisation sans filtre actif.
    await expect(page.locator('.btn-reset')).toHaveCount(0);

    await page.locator('#category-filter').selectOption('animaux');
    await expect(page.locator('.icon-card')).toHaveCount(ANIMALS_COUNT);
    await expect(page.locator('.btn-reset')).toBeVisible();

    await page.locator('.btn-reset').click();
    await expect(page.locator('#category-filter')).toHaveValue('');
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);
    await expect(page.locator('.btn-reset')).toHaveCount(0);
  });
});
