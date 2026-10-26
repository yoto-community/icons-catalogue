import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Yoto Icons Catalogue',
        short_name: 'Yoto Icons',
        description:
          "Catalogue unifié d'icônes 16×16 pour Yoto Player — Recherche dans yotopixels, yotoicons et yoto-official",
        theme_color: '#e94560',
        background_color: '#f8f9fa',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/icons-catalogue/',
        start_url: '/icons-catalogue/',
        icons: [
          {
            src: '/icons-catalogue/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons-catalogue/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons-catalogue/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons-catalogue/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons-catalogue/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons-catalogue/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons-catalogue/icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icons-catalogue/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['utilities', 'education', 'entertainment'],
        shortcuts: [
          {
            name: 'Favoris',
            short_name: 'Favoris',
            description: 'Vos icônes favorites',
            url: '/icons-catalogue/favorites',
            icons: [{ src: '/icons-catalogue/icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        // P1.3 : ne PAS précacher les données (`icons.json` ~19 Mo, etc.).
        // Précacher le catalogue alourdissait chaque installation du SW ; les
        // données passent par une règle de cache *runtime* (mises en cache à la
        // première visite, disponibles hors-ligne ensuite).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Données du catalogue : réseau d'abord (fraîcheur), repli cache.
            urlPattern: /\/icons-catalogue\/.*\.(json|bin)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'catalogue-data',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: '/icons-catalogue/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Pas de sourcemap en production : les cartes sources exposeraient le code
    // et alourdiraient l'artefact publié sur GitHub Pages.
    sourcemap: false,
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) n'accepte plus la forme objet : on isole `lunr`
        // (moteur de recherche) dans son propre chunk via une fonction.
        manualChunks: (id) => (id.includes('/node_modules/lunr/') ? 'lunr' : undefined),
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        // Fichiers sans code exécutable : barrels de ré-export et types seuls.
        'src/**/index.ts',
        'src/**/*.d.ts',
      ],
      // Seuils : plancher global (régresse si on ajoute du code sans test)
      // + verrouillage des modules de logique déjà couverts à 100 %.
      //
      // Recalibrés pour Vitest 5 : son remapper de couverture (ast-v8-to-istanbul
      // v1) découpe différemment du moteur précédent, ce qui abaisse certains
      // pourcentages à granularité fine. Les seuils ci-dessous sont posés juste
      // sous la couverture réellement mesurée : ils gardent leur rôle de
      // garde-fou anti-régression sans dépendre du découpage exact du moteur.
      thresholds: {
        // Plancher global aligné sur la couverture réelle (~97 %), avec une
        // marge pour ne pas casser à chaque nouvelle ligne légitime.
        statements: 90,
        branches: 85,
        functions: 85,
        lines: 90,
        '**/src/api/**': { statements: 100, branches: 100, functions: 100, lines: 100 },
        '**/src/constants/**': { statements: 100, branches: 100, functions: 100, lines: 100 },
        '**/src/searchIndex.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        '**/src/types/guards.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        '**/src/utils/**': { statements: 90, branches: 85, functions: 85, lines: 90 },
        '**/src/searchEngine.ts': { statements: 95, branches: 83, functions: 100, lines: 95 },
        '**/src/hooks/usePagination.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/hooks/useUrlSync.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        // Modules critiques verrouillés (chemins et recherche).
        '**/src/hooks/useFilteredIcons.ts': {
          statements: 95,
          branches: 90,
          functions: 100,
          lines: 95,
        },
        '**/src/hooks/useKeyboardShortcuts.ts': {
          statements: 100,
          branches: 90,
          functions: 100,
          lines: 100,
        },
        '**/src/components/Filters.tsx': {
          statements: 90,
          branches: 80,
          functions: 75,
          lines: 90,
        },
        '**/src/components/Header.tsx': {
          statements: 100,
          branches: 85,
          functions: 100,
          lines: 100,
        },
        '**/src/components/FavoriteButton.tsx': {
          statements: 100,
          branches: 85,
          functions: 100,
          lines: 100,
        },
        '**/src/components/YotoMiniPreview.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/context/FavoritesContext.tsx': {
          statements: 93,
          branches: 80,
          functions: 100,
          lines: 92,
        },
        '**/src/context/IconsDataContext.tsx': {
          statements: 93,
          branches: 65,
          functions: 100,
          lines: 95,
        },
        // Modules du lot P3 (confort UX) verrouillés.
        '**/src/utils/zip.ts': { statements: 100, branches: 100, functions: 100, lines: 100 },
        '**/src/utils/exportFavorites.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/utils/highlight.ts': {
          statements: 100,
          branches: 80,
          functions: 100,
          lines: 100,
        },
        // Éditeur d'icônes (lot L1) : cœur pur et persistance verrouillés.
        '**/src/utils/pixelEditor.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/utils/pngExport.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/utils/editorStorage.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/utils/editorKeyboard.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        // Import d'image & socle (lot L4). Les branches restantes sont des
        // gardes défensives (données/navigateur irréguliers), d'où le seuil 90.
        '**/src/utils/imageImport.ts': {
          statements: 95,
          branches: 90,
          functions: 100,
          lines: 100,
        },
        '**/src/utils/imageDecode.ts': {
          statements: 93,
          branches: 85,
          functions: 100,
          lines: 100,
        },
        '**/src/hooks/useImageImport.ts': {
          statements: 100,
          branches: 90,
          functions: 100,
          lines: 100,
        },
        '**/src/pages/EditorPage.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        // Interface de l'éditeur (lot L2) : composants présentationnels.
        '**/src/components/editor/**': {
          statements: 95,
          branches: 85,
          functions: 80,
          lines: 95,
        },
        '**/src/hooks/usePixelEditor.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/hooks/useEditorDraft.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/hooks/useTheme.ts': {
          statements: 95,
          branches: 90,
          functions: 100,
          lines: 100,
        },
        '**/src/hooks/useFocusTrap.ts': {
          statements: 100,
          branches: 90,
          functions: 100,
          lines: 100,
        },
        '**/src/components/HighlightedText.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/components/ThemeSwitcher.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/components/SettingsMenu.tsx': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        '**/src/pages/**': { statements: 95, branches: 85, functions: 85, lines: 95 },
        '**/src/workers/**': { statements: 95, branches: 80, functions: 100, lines: 100 },
      },
    },
  },
});
