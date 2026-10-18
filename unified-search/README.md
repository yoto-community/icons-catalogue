# Yoto Icons Catalogue — Search Frontend

Application React (Vite + TypeScript + PWA) pour la recherche unifiée d'icônes 16×16 Yoto Player.

## Fonctionnalités

- **Recherche unifiée** : yotopixels + yotoicons + yoto-official sans filtre de source
- **Recherche full-text** via Lunr.js (tags boostés ×10, artiste, titre, catégorie, sous-catégorie)
- **Filtres** : Catégorie, Sous-catégorie (dépendante de la catégorie)
- **Tri** : Téléchargements (défaut), Titre A-Z, Date
- **Pagination** (48 icônes/page)
- **Raccourcis clavier** :
  - `/` → Focus recherche
  - `Échap` → Effacer recherche / Fermer modal
- **Synchronisation URL** : partage de liens avec filtres (`?q=moon&cat=nature&sort=downloads&page=2`)
- **Favoris** : Persistance localStorage, page dédiée `/favorites`
- **Navigation par catégories** : `/categories` → `/categories/:category`
- **Navigation par auteurs** : `/authors` → `/authors/:artist`
- **Modal détail** : Aperçu grand format, téléchargement, métadonnées complètes
- **Mini-preview** : Panneau latéral au survol clic / icône 🔍
- **Responsive** : mobile-first, grille adaptative (1 à 5 colonnes)
- **Accessibilité** : ARIA, focus visible, navigation clavier complète
- **PWA** : Installation, cache offline (Workbox), mise à jour auto

## Installation

```bash
cd unified-search
pnpm install
```

## Développement

```bash
pnpm run dev
# http://localhost:5173/icons-catalogue/
```

## Build production

```bash
pnpm run build
# Sortie dans dist/
```

## Structure

```
unified-search/
├── public/
│   ├── combined-icons.json      # Données icônes (copié depuis ../data au build)
│   ├── summary-combined.json    # Stats globales (copié depuis ../data au build)
│   └── favicon.svg
├── src/
│   ├── main.tsx                 # Point d'entrée + React Router + PWA register
│   ├── App.tsx                  # Composant principal + routes + état global
│   ├── styles.css               # Styles CSS natifs (variables CSS, pas de framework)
│   ├── components/              # Composants UI réutilisables
│   │   ├── Header.tsx           # En-tête + navigation
│   │   ├── SearchBar.tsx        # Barre de recherche + raccourci /
│   │   ├── Filters.tsx          # Filtres catégorie/sous-catégorie/tri/reset
│   │   ├── StatsBar.tsx         # Statistiques + tags populaires
│   │   ├── IconsGrid.tsx        # Grille responsive d'icônes
│   │   ├── IconCard.tsx         # Carte icône individuelle
│   │   ├── IconDetailModal.tsx  # Modal détail + téléchargement
│   │   ├── YotoMiniPreview.tsx  # Mini-preview latéral
│   │   ├── Pagination.tsx       # Pagination
│   │   ├── EmptyState.tsx       # État vide + reset
│   │   ├── LoadingState.tsx     # Squelette de chargement
│   │   ├── Footer.tsx           # Pied de page
│   │   └── FavoriteButton.tsx   # Bouton favori (cœur)
│   ├── hooks/                   # Hooks personnalisés
│   │   ├── useIconsData.ts      # Chargement données + index Lunr + catégories
│   │   ├── useFilteredIcons.ts  # Filtrage (Lunr + catégorie + sous-cat) + tri
│   │   ├── usePagination.ts     # Pagination (48/page)
│   │   ├── useUrlSync.ts        # Synchronisation URL <-> état
│   │   ├── useDebouncedSearch.ts# Debounce recherche (80ms)
│   │   ├── useKeyboardShortcuts.ts # Raccourcis clavier
│   │   └── useFavorites.ts      # Gestion favoris (localStorage)
│   ├── pages/                   # Pages routées
│   │   ├── CataloguePage.tsx    # Page principale (via App.tsx)
│   │   ├── FavoritesPage.tsx    # /favorites
│   │   ├── CategoriesListPage.tsx # /categories
│   │   ├── CategoryIconsPage.tsx  # /categories/:category
│   │   ├── AuthorsListPage.tsx    # /authors
│   │   └── AuthorIconsPage.tsx    # /authors/:artist
│   ├── types/                   # Types TypeScript
│   │   └── index.ts             # Icon, SummaryData, SortOption, FilterState
│   ├── utils/                   # Utilitaires
│   │   ├── index.ts             # Helpers divers
│   │   └── iconUtils.ts         # Normalisation URLs, formats
│   ├── constants/               # Constantes
│   │   └── index.ts             # ICONS_PER_PAGE, DEBOUNCE_MS, URLs
│   └── context/                 # Context React
│       └── FavoritesContext.tsx # Provider favoris
├── dist/                        # Build production (GitHub Pages)
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts               # Config Vite + PWA (Workbox) + base path
└── README.md
```

## Déploiement GitHub Pages

### Via GitHub Actions (recommandé)

Le déploiement est géré par le workflow racine `.github/workflows/update-and-deploy.yml` qui :
1. Lance les scrapers + build index (racine)
2. Build le frontend (`unified-search`)
3. Déploie `dist/` sur branche `gh-pages`

### Manuel

```bash
pnpm run build
# Puis déployer le dossier dist/ sur GitHub Pages (branche gh-pages ou dossier /docs)
```

**Important** : `vite.config.ts` configure `base: '/icons-catalogue/'`. L'URL finale sera `https://username.github.io/icons-catalogue/`.

Le PWA scope est `/icons-catalogue/` et start_url `/icons-catalogue/`.

## API de données

L'application charge deux fichiers JSON au démarrage (depuis `public/`) :

1. `combined-icons.json` — Tableau d'icônes normalisées (~27 400 entrées)
2. `summary-combined.json` — Statistiques globales

### Format d'une icône

```json
{
  "id": "yi-artist-titre-icone",
  "source": "yotoicons",
  "tags": ["moon", "night"],
  "artist": "@artistname",
  "title": "Titre de l'icône",
  "preview_image": "https://.../preview-16x16.png",
  "download_url": "https://.../icon-16x16.png",
  "category": "nature",
  "subcategory": "croissant",
  "downloads": 123,
  "date_added": "2026-10-18T10:30:00Z"
}
```

### Format du résumé

```json
{
  "total": 27399,
  "bySource": {
    "yotopixels": 1314,
    "yotoicons": 25566,
    "yoto-official": 519
  },
  "byCategory": {
    "objets": 26893,
    "animaux": 222,
    "nature": 84,
    ...
  },
  "byArtist": { "@artist": 123, ... },
  "topTagsSorted": { "moon": 450, "star": 320, ... }
}
```

## Architecture des hooks

### `useIconsData` — Chargement initial
- Fetch `combined-icons.json` + `summary-combined.json`
- Construit l'index Lunr côté client (champs: id, tags^10, artist, title, category, subcategory)
- Extrait catégories/sous-catégories uniques + mapping cat→subcats
- Retourne : `icons`, `index`, `isIndexLoaded`, `isLoading`, `categories`, `subcategories`, `subcategoriesByCategory`, `summary`

### `useFilteredIcons` — Filtrage + tri (memoized)
- Recherche Lunr si query + index chargé
- Filtre catégorie / sous-catégorie
- Tri : downloads DESC, title ASC, date DESC
- Dépendances : `[icons, index, query, category, subcategory, sortBy]`

### `usePagination` — Pagination
- 48 icônes/page (constante `ICONS_PER_PAGE`)
- Retourne : `paginatedIcons`, `currentPage`, `totalPages`, `totalFiltered`, `handlePageChange`, `setCurrentPage`

### `useUrlSync` — Synchronisation URL bidirectionnelle
- Lit params au mount : `q`, `cat`, `subcat`, `sort`, `page`
- Écrit params à chaque changement (debounced via `useDebouncedSearch`)
- `replaceState` pour ne pas polluer l'historique

### `useDebouncedSearch` — Debounce 80ms
- Diffère `setQuery` et `syncUrl`
- Callback `onSearch` pour reset page à 1

### `useKeyboardShortcuts` — Raccourcis
- `/` → focus search input (si pas déjà dans input/modal)
- `Escape` → clear query / close modal / clear preview

### `useFavorites` — Favoris (localStorage)
- Clé `yoto-icons-favorites` (array d'IDs)
- `toggleFavorite(id)`, `isFavorite(id)`, `getFavorites()`, `clearFavorites()`

## Personnalisation

### Couleurs (CSS variables dans `src/styles.css`)

```css
:root {
  --color-primary: #e94560;        /* Couleur principale */
  --color-primary-dark: #c0392b;   /* Survol boutons */
  --color-primary-light: #ff6b7a;  /* Focus */
  --color-background: #f8f9fa;     /* Fond page */
  --color-surface: #ffffff;        /* Cartes, modals */
  --color-surface-hover: #f1f3f5;  /* Hover cartes */
  --color-text: #212529;           /* Texte principal */
  --color-text-muted: #6c757d;     /* Texte secondaire */
  --color-border: #dee2e6;         /* Bordures */
  --color-focus: #e94560;          /* Anneau focus */
  --shadow-sm: 0 1px 2px rgba(0,0,0,.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,.1);
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --transition: 150ms ease;
}
```

### Constantes (`src/constants/index.ts`)

```typescript
export const ICONS_PER_PAGE = 48;
export const DEBOUNCE_MS = 80;
export const INDEX_URL = '/icons-catalogue/combined-icons.json';
export const SUMMARY_URL = '/icons-catalogue/summary-combined.json';
```

## Dépendances principales

| Package | Version | Usage |
|---------|---------|-------|
| React | 18 | UI |
| React DOM | 18 | Rendering |
| React Router DOM | 6 | Routing SPA |
| Lunr.js | 2.3.9 | Full-text search client-side |
| Vite | 5 | Build tool + dev server |
| TypeScript | 5 | Typage statique |
| vite-plugin-pwa | latest | PWA + Workbox |

**Pas de framework CSS** — Styles CSS natifs avec variables personnalisées.

## PWA (Progressive Web App)

Configuré via `vite-plugin-pwa` + Workbox :

- **Manifest** : name, icons (72→512px), shortcuts (Favoris), scope `/icons-catalogue/`
- **Cache** : `combined-icons.json` (max 15 Mo), assets statiques, fonts Google
- **Stratégie** : `CacheFirst` pour assets, `NetworkFirst` pour données
- **Auto-update** : `registerType: 'autoUpdate'` + refresh prompt

## Accessibilité

- **ARIA** : `aria-live="polite"` sur grille résultats, `aria-busy` pendant chargement
- **Focus visible** : outline sur tous les éléments interactifs
- **Navigation clavier** : Tab order logique, Escape pour fermer modals/preview
- **Labels** : `aria-label` sur boutons icônes, `role="button"` où nécessaire
- **Contraste** : Respecte WCAG AA sur couleurs par défaut
- **Reduced motion** : `@media (prefers-reduced-motion)` désactive transitions

## Performance

- **Code splitting** : Lunr en chunk séparé (`manualChunks: { lunr: ['lunr'] }`)
- **Lazy loading** : Images `loading="lazy"` dans `IconCard`
- **Memoization** : `useMemo` pour filtrage, `useCallback` pour handlers
- **Debounce** : 80ms sur recherche
- **Virtual scrolling** : Non (pagination 48/page), grille CSS simple

## Scripts disponibles

```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext ts,tsx",
  "typecheck": "tsc --noEmit"
}
```

## Variables d'environnement

Aucune requise. L'application est 100% statique.

## Dépannage

### "Failed to fetch combined-icons.json"
- Vérifier que `pnpm run build:index` a été lancé à la racine
- Les fichiers sont copiés dans `unified-search/public/` par `build-combined.js`

### Index Lunr non chargé
- Vérifier la console pour erreurs de fetch
- L'index est reconstruit côté client à partir de `combined-icons.json`

### PWA ne s'installe pas
- Servir en HTTPS (requis pour PWA)
- Vérifier `manifest.json` dans `dist/`
- Vérifier `sw.js` enregistré (DevTools > Application > Service Workers)

### Styles cassés
- Pas de framework CSS, vérifier `src/styles.css` pour variables manquantes
- Build Vite minifie le CSS en production

## Licence

MIT — Code frontend uniquement. Les icônes restent la propriété de leurs auteurs respectifs.