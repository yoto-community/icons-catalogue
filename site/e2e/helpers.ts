import { expect, type Page } from '@playwright/test';
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
export const YOTOPIXELS_COUNT = icons.filter((icon) => icon.source === 'yotopixels').length; // 18
export const YOTOICONS_COUNT = icons.filter((icon) => icon.source === 'yotoicons').length; // 32
export { icons, summary };

/** Répartit la fixture par `source` pour servir les shards. */
function splitBySource(list: typeof icons): Record<string, typeof icons> {
  return list.reduce<Record<string, typeof icons>>((acc, icon) => {
    (acc[icon.source] ??= []).push(icon);
    return acc;
  }, {});
}

const bySource = splitBySource(icons);

/** Manifeste dérivé de la fixture (2 sources). */
const manifest = {
  schemaVersion: 2,
  catalogVersion: 'e2e-fixture',
  counts: { total: icons.length },
  sources: Object.entries(bySource).map(([id, arr]) => ({ id, count: arr.length })),
};

/**
 * Intercepte le manifeste + les shards par source + le résumé, ainsi que les
 * polices distantes (aucune dépendance réseau → tests déterministes).
 */
export async function stubCatalogueData(page: Page): Promise<void> {
  await page.route('**/index.json', (route) => route.fulfill({ json: manifest }));
  await page.route('**/icons-by-source/*.json', (route) => {
    const source = new URL(route.request().url()).pathname
      .split('/')
      .pop()!
      .replace(/\.json$/, '');
    return route.fulfill({ json: bySource[source] ?? [] });
  });
  await page.route('**/summary.json', (route) => route.fulfill({ json: summary }));
  // Polices Google : aucune dépendance réseau (tests déterministes, offline OK).
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
}

/**
 * Intercepte les données et les polices distantes, puis ouvre l'accueil.
 * `search` permet d'ouvrir une URL pré-remplie (ex. « ?source=yotopixels »).
 */
export async function openCatalogue(page: Page, search = ''): Promise<void> {
  await stubCatalogueData(page);
  await page.goto(`/icons-catalogue/${search}`);
}

/**
 * Attend la fin du chargement progressif (P1.3) avant d'interagir avec la
 * grille. `aria-busy` passe à `false` seulement quand tous les shards sont
 * fusionnés et l'index de recherche prêt ; sans cela, un tri global peut
 * réordonner (voire démonter) une carte pendant l'action.
 */
export async function waitForCatalogueReady(page: Page): Promise<void> {
  await expect(page.locator('.results-section')).toHaveAttribute('aria-busy', 'false');
}
