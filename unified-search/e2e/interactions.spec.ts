import { test, expect } from '@playwright/test';
import { openCatalogue, PER_PAGE, MOON_COUNT } from './helpers';

/**
 * E2E — interactions : modale de détail (clic carte / bouton / Échap /
 * clic hors modale), raccourcis clavier (`/`, Échap), bascule de langue.
 */

test.describe('modale de détail', () => {
  test("ouverture depuis la carte, fermeture par le bouton, Échap et clic sur l'overlay", async ({
    page,
  }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    const firstCard = page.locator('.icon-card').first();
    const firstTitle = (await firstCard.locator('.icon-title').textContent())?.trim() ?? '';

    // Ouverture : le titre de la modale reprend celui de la carte.
    await firstCard.locator('.icon-link').click();
    const modal = page.locator('.modal-overlay');
    await expect(modal).toBeVisible();
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('#modal-title')).toHaveText(firstTitle);
    // Actions de la modale : téléchargement + source.
    await expect(page.locator('.modal .btn-primary')).toBeVisible();
    await expect(page.locator('.modal .btn-secondary')).toBeVisible();

    // Fermeture par le bouton.
    await page.locator('.modal-close').click();
    await expect(modal).toHaveCount(0);

    // Fermeture par Échap.
    await firstCard.locator('.icon-link').click();
    await expect(modal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(modal).toHaveCount(0);

    // Fermeture par un clic hors contenu (position hors de .modal, qui stopPropagation).
    await firstCard.locator('.icon-link').click();
    await expect(modal).toBeVisible();
    await modal.click({ position: { x: 5, y: 5 } });
    await expect(modal).toHaveCount(0);
  });

  test('un favori ajouté depuis la carte survit à la modale', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);
    await expect(page.locator('header .nav-count')).toHaveCount(0);

    // Favoriter via la carte, puis ouvrir/fermer la modale de la même icône.
    await page.locator('.icon-card .favorite-btn').first().click();
    await expect(page.locator('header .nav-count')).toHaveText('1');

    await page.locator('.icon-card .icon-link').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.modal-overlay')).toHaveCount(0);

    // Le favori est intact après aller-retour dans la modale.
    await expect(page.locator('.icon-card .favorite-btn').first()).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.locator('header .nav-count')).toHaveText('1');
  });
});

test.describe('raccourcis clavier', () => {
  test('/ cible la recherche et permet de chercher immédiatement', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    // Échap (hors modale) blurre la recherche : on part d'un état connu.
    await page.locator('#search-input').focus();
    await page.keyboard.press('Escape');
    await expect(page.locator('#search-input')).not.toBeFocused();

    // Le raccourci / reprend la main sur le champ…
    await page.keyboard.press('/');
    await expect(page.locator('#search-input')).toBeFocused();

    // …et la frappe qui suit alimente réellement la recherche.
    await page.keyboard.type('moon');
    await expect(page.locator('.icon-card')).toHaveCount(MOON_COUNT);
  });

  test('une frappe de raccourci dans un champ ne redéclenche pas le raccourci', async ({
    page,
  }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);

    // Saisir « / » dans la recherche doit chercher « / », pas re-focuser.
    await page.locator('#search-input').fill('/');
    await expect(page.locator('#search-input')).toHaveValue('/');
    // Requête sans résultat (« / ») : état vide, jamais de crash.
    await expect(page.locator('.empty-state')).toBeVisible();
  });
});

test.describe('langue', () => {
  test("bascule EN -> FR : l'interface suit (placeholder et indice)", async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('#search-input')).toHaveCount(1);

    // Locale navigateur Chromium = en-US : démarrage en anglais.
    const placeholderEn = await page.locator('#search-input').getAttribute('placeholder');
    const hintEn = await page.locator('#search-hint').textContent();

    await page.locator('#language-select').selectOption('fr');

    await expect(page.locator('#search-input')).not.toHaveAttribute(
      'placeholder',
      placeholderEn ?? ''
    );
    const hintFr = await page.locator('#search-hint').textContent();
    expect(hintFr).not.toBe(hintEn);
  });
});
