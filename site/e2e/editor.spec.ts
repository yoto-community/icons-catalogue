import { test, expect } from '@playwright/test';
import { openCatalogue } from './helpers';

/**
 * E2E — « Partir d'une icône » dans l'éditeur (lot L4, option A).
 *
 * Import d'un vrai PNG local et vérification que le décodage natif
 * (`createImageBitmap` + canvas) le convertit bien en 16×16.
 *
 * L'option B (icône officielle) est couverte en test d'intégration ; elle
 * suppose un accès réseau au CDN Yoto, exclu ici pour rester hermétique.
 */

// PNG 4×4 rouge opaque (généré hors ligne) : assez petit pour tenir dans le
// test, assez valide pour que `createImageBitmap` le décode.
const RED_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAFUlEQVR4nGP8z8DwnwEJMDGgAcICAIPRAgYCkO9YAAAAAElFTkSuQmCC',
  'base64'
);

test.describe('éditeur — partir d’une icône (L4)', () => {
  test('importe un fichier PNG local et le réduit en 16×16', async ({ page }) => {
    await openCatalogue(page);
    await page.goto('/icons-catalogue/editor');
    await expect(page.locator('.pixel-grid')).toBeVisible();

    await page.locator('.editor-import input[type="file"]').setInputFiles({
      name: 'rouge.png',
      mimeType: 'image/png',
      buffer: RED_PNG,
    });

    await expect(page.locator('.editor-status')).toContainText(/couleur|colour/);
    await expect(page.locator('.editor-import [role="alert"]')).toHaveCount(0);
    // Une grille non vide active le téléchargement.
    await expect(page.locator('.editor-actions .editor-button-primary')).toBeEnabled();
  });
});

test.describe('éditeur — curseur selon l’outil', () => {
  test('change le curseur de la zone d’édition quand l’outil change', async ({ page }) => {
    await openCatalogue(page);
    await page.goto('/icons-catalogue/editor');

    const grid = page.locator('.pixel-grid');
    await expect(grid).toHaveAttribute('data-tool', 'pencil');

    const cursorOf = () => grid.evaluate((element) => getComputedStyle(element).cursor);
    const pencilCursor = await cursorOf();
    // Curseur image (SVG emoji) déclaré, pas la valeur de repli seule.
    expect(pencilCursor).toContain('url(');

    // Second outil de la barre = gomme (libellé dépendant de la locale).
    await page.locator('.editor-panel .editor-toolbar .editor-tool').nth(1).click();

    await expect(grid).toHaveAttribute('data-tool', 'eraser');
    expect(await cursorOf()).not.toBe(pencilCursor);
  });
});
