import type { Page } from '@playwright/test';
import icons from './fixtures/icons.small.json' with { type: 'json' };
import summary from './fixtures/summary.small.json' with { type: 'json' };

/**
 * Aides E2E partagées : fixture de 60 icônes interceptée par page.route.
 *
 * Répartition : 12 lunes, 8 chats, 10 voitures, 10 arbres, 10 lapins, 10 soleils.
 * Page 1 = 48 icônes (ICONS_PER_PAGE), page 2 = 12.
 * Tri par défaut (téléchargements décroissants) : « sunny day 10 » en tête.
 */

export const TOTAL = icons.length; // 60
export const PER_PAGE = 48;
export const MOON_COUNT = icons.filter((icon) => icon.tags.includes('moon')).length; // 12
export const CAT_COUNT = icons.filter((icon) => icon.tags.includes('cat')).length; // 8
export const NATURE_COUNT = icons.filter((icon) => icon.category === 'nature').length; // 32
export const ANIMALS_COUNT = icons.filter((icon) => icon.category === 'animaux').length; // 18
export const LUNE_COUNT = icons.filter((icon) => icon.subcategory === 'lune').length; // 12
export { icons, summary };

/** Intercepte les données et les polices distantes, puis ouvre l'accueil. */
export async function openCatalogue(page: Page): Promise<void> {
  await page.route('**/icons.json', (route) => route.fulfill({ json: icons }));
  await page.route('**/summary.json', (route) => route.fulfill({ json: summary }));
  // Polices Google : aucune dépendance réseau (tests déterministes, offline OK).
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
  await page.goto('/icons-catalogue/');
}
