import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { openCatalogue, PER_PAGE } from './helpers';

/**
 * E2E — audit d'accessibilité automatisé (axe-core), normes WCAG 2.0/2.1 A + AA.
 *
 * Seules les violations de gravité « serious » ou « critical » font échouer le
 * test : les « minor » / « moderate » restent visibles dans l'erreur mais ne
 * bloquent pas, pour éviter un bruit intenable sur une app bénévole.
 * Chaque test précise le scénario scanné pour rendre l'échec localisable.
 */

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: Page, label: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  );
  const summary = blocking.map(
    (v) => `${v.id} [${v.impact}] — ${v.help} (${v.nodes.length} nœud(s)) : ${v.helpUrl}`
  );

  expect(summary, `violations sérieuses sur : ${label}`).toEqual([]);
}

test.describe('accessibilité (axe-core)', () => {
  test('accueil avec grille chargée', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);
    await scan(page, 'accueil — grille paginée');
  });

  test('recherche filtrée', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);
    await page.locator('#search-input').fill('moon');
    await expect(page.locator('.icon-card')).toHaveCount(12);
    await scan(page, 'accueil — résultats moon');
  });

  test('état vide', async ({ page }) => {
    await openCatalogue(page);
    await page.locator('#search-input').fill('zzzzrien');
    await expect(page.locator('.empty-state')).toBeVisible();
    await scan(page, 'accueil — état vide');
  });

  test('modale de détail ouverte', async ({ page }) => {
    await openCatalogue(page);
    await expect(page.locator('.icon-card')).toHaveCount(PER_PAGE);
    await page.locator('.icon-card .icon-link').first().click();
    await expect(page.locator('.modal-overlay')).toBeVisible();
    await scan(page, 'modale de détail');
  });

  test('page favoris (avec un favori)', async ({ page }) => {
    await openCatalogue(page);
    await page.locator('.icon-card .favorite-btn').first().click();
    await page.goto('/icons-catalogue/favorites');
    await expect(page.locator('.icon-card')).toHaveCount(1);
    await scan(page, 'page favoris');
  });

  test('page développeurs', async ({ page }) => {
    await openCatalogue(page);
    await page.goto('/icons-catalogue/developers');
    await expect(page.locator('main')).toBeVisible();
    await scan(page, 'page développeurs');
  });

  test('page auteur', async ({ page }) => {
    await openCatalogue(page);
    await page.goto('/icons-catalogue/authors/%40e2e-sun');
    await expect(page.locator('.author-page-name')).toHaveText('@e2e-sun');
    await scan(page, 'page auteur');
  });
});
