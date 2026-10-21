import { test, expect } from '@playwright/test';
import { openCatalogue, waitForCatalogueReady, PER_PAGE, MOON_COUNT } from './helpers';

/**
 * E2E — confort UX du lot P3 : thème clair/sombre (persistance), surlignage
 * des termes recherchés, piège de focus de la modale, export ZIP des favoris.
 *
 * Ces parcours traversent le vrai navigateur (localStorage, téléchargement,
 * navigation clavier) : complément des tests unitaires qui les isolent.
 */

test.describe('thème clair / sombre', () => {
  test('applique et persiste le thème après rechargement', async ({ page }) => {
    await openCatalogue(page);

    const html = page.locator('html');
    // L'attribut est posé avant le premier rendu (script d'amorçage).
    await expect(html).toHaveAttribute('data-theme', /light|dark/);

    // Le sélecteur de thème est regroupé dans le menu « Réglages ».
    await page.locator('#settings-toggle').click();
    await page.locator('#theme-select').selectOption('dark');
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');

    await page.locator('#settings-toggle').click();
    await expect(page.locator('#theme-select')).toHaveValue('dark');

    await page.locator('#theme-select').selectOption('light');
    await expect(html).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('surlignage de la recherche', () => {
  test('entoure le terme recherché de <mark> dans les cartes', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    await page.locator('#search-input').fill('moon');
    await expect(page.locator('.icon-card')).toHaveCount(MOON_COUNT);

    const marks = page.locator('.icon-title mark');
    await expect(marks.first()).toBeVisible();
    await expect(marks.first()).toHaveText(/moon/i);
  });
});

test.describe('accessibilité de la modale', () => {
  test('piège le focus et le restaure à la fermeture', async ({ page }) => {
    await openCatalogue(page);
    // P1.3 : attendre la fin du chargement progressif pour que la grille soit
    // stable pendant l'interaction.
    await waitForCatalogueReady(page);
    const trigger = page.locator('.icon-card').first().locator('.icon-link');
    await trigger.click();

    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();

    // Le focus entre dans la modale : premier élément focusable = bouton fermer.
    await expect(page.locator('.modal-close')).toBeFocused();

    // Shift+Tab depuis le premier élément boucle vers le dernier.
    const focusables = page.locator('.modal-overlay a[href], .modal-overlay button');
    await page.keyboard.press('Shift+Tab');
    await expect(focusables.last()).toBeFocused();

    // Tab depuis le dernier revient au premier.
    await page.keyboard.press('Tab');
    await expect(page.locator('.modal-close')).toBeFocused();

    // Échap ferme la modale et rend le focus au déclencheur.
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test('un lien d’évitement pointe vers le contenu principal', async ({ page }) => {
    await openCatalogue(page);

    const skip = page.locator('a.skip-link');
    await expect(skip).toHaveAttribute('href', '#main-content');
    await expect(page.locator('main#main-content')).toBeVisible();
  });
});

test.describe('export ZIP des favoris', () => {
  test('télécharge une archive des favoris', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    await page.locator('.icon-card .favorite-btn').first().click();
    await expect(page.locator('header .nav-count')).toHaveText('1');

    await page.goto('/icons-catalogue/favorites');
    await expect(page.locator('.favorites-page')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('.favorites-actions button').click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe('yoto-favorites.zip');
  });
});
