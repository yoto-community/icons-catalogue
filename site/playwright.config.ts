import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration E2E (Playwright).
 *
 * - Sert la build de PRODUCTION (`vite build` + `vite preview`) : on teste ce
 *   qui est réellement déployé (worker en chunk séparé, PWA compilée).
 * - Les service workers sont bloqués : le SW de la PWA perturberait
 *   l'interception des routes (`page.route`) et rendrait les tests non
 *   déterministes.
 * - Voir e2e/search.spec.ts : les données sont interceptées (fixture de
 *   60 icônes) pour rester hermétique et rapide.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    // Pas d'animations : les tests mesurent l'état final (et les audits axe
    // ne voient plus des cartes en cours de fondu, qui faussent le contraste).
    reducedMotion: 'reduce',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Serveur principal (SPA avec repli automatique) pour les specs de parcours.
      command: 'pnpm run build && pnpm exec vite preview --port 4173 --strictPort',
      url: 'http://localhost:4173/icons-catalogue/',
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
    {
      // Serveur « comme GitHub Pages » (404 + corps de 404.html) pour la spec de
      // repli SPA (e2e/spa-fallback.spec.ts). Il attend la build (503 tant que
      // dist/index.html n'existe pas).
      command: 'node e2e/serve-dist.mjs',
      url: 'http://localhost:4174/icons-catalogue/',
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
    },
  ],
});
