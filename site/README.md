# Yoto Icons Catalogue — Search Frontend

Application React (Vite + TypeScript + PWA) pour la recherche unifiée d'icônes 16×16 Yoto Player.

## Fonctionnalités

- **Recherche unifiée** : yotopixels + yotoicons + yoto-official sans filtre de source
- **Recherche full-text** via Lunr.js (tags boostés ×10, artiste, titre, catégorie, sous-catégorie)
- **Filtres** : Catégorie, Sous-catégorie (dépendante de la catégorie), Source (yotopixels / yotoicons / yoto-official), Licence (CC-BY-SA / CC-BY-NC / Yoto Official)
- **Tri** : Téléchargements (défaut), Titre A-Z
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
- **Robustesse** : état d'erreur explicite + « Réessayer » si le catalogue ne charge pas, `ErrorBoundary` racine (pas de page blanche)
- **PWA** : Installation, cache offline (Workbox) — données mises en cache à la première visite (cache runtime, non précachées), mise à jour auto

## Installation

```bash
cd site
pnpm install
```

## Développement

```bash
pnpm run dev
# http://localhost:5173/icons-catalogue/
```

## Build production

```bash
# Prérequis (racine) : données générées, non versionnées
cd .. && pnpm install && pnpm run build:api && cd site

pnpm run build
# Sortie dans dist/
```

Le build commence par `check-data` : sans `public/summary.json`,
`public/index.json` et les shards `public/icons-by-source/` (etc.), il échoue en
indiquant la commande `build:api` à lancer.

## Structure

```
site/
├── public/                      # Publié tel quel sous /icons-catalogue/
│   ├── index.json               # Manifeste (sources, compteurs) — GÉNÉRÉ par build:api (non versionné)
│   ├── summary.json             # Statistiques — GÉNÉRÉ par build:api (non versionné)
│   ├── icons-by-source/         # Shards par source — GÉNÉRÉ par build:api (non versionné)
│   ├── icons/                   # Icônes PWA (PNG 72→512, pas les icônes du catalogue)
│   └── favicon.svg
├── scripts/
│   ├── check-bundle-size.mjs    # Budget de taille de bundle (gzip)
│   ├── check-i18n-keys.mjs      # Parité fr/en + clés utilisées
│   ├── check-data.mjs           # Données générées présentes avant le build (P1.5)
│   ├── check-precache.mjs       # Aucune donnée précachée par le SW (P1.3)
│   ├── postbuild.mjs            # Génère dist/404.html (repli SPA GitHub Pages)
│   └── check-spa-fallback.mjs   # Vérifie que dist/404.html est présent et à jour
├── e2e/                         # Playwright (search, filters, favorites, interactions, a11y, spa-fallback)
├── src/
│   ├── main.tsx                 # Point d'entrée + providers + enregistrement PWA
│   ├── App.tsx                  # Routes + état modal global
│   ├── styles.css               # Styles CSS natifs (variables CSS, pas de framework)
│   ├── searchIndex.ts           # Construction de l'index Lunr (partagé)
│   ├── searchEngine.ts          # Moteur de recherche (worker + repli main-thread)
│   ├── workers/
│   │   └── searchIndex.worker.ts # Construction/conserve l'index hors main thread
│   ├── api/
│   │   ├── client.ts            # Client HTTP + classe ApiError typée
│   │   └── manifest.ts          # Manifeste publié : types, garde, ordre des shards
│   ├── components/              # Composants UI réutilisables
│   │   ├── IconsBrowser.tsx     # Vue catalogue partagée (départ + pages filtrées)
│   │   ├── BackLink.tsx         # Lien retour (détail catégorie/artiste)
│   │   ├── Header.tsx           # En-tête + navigation + LanguageSwitcher
│   │   ├── SearchBar.tsx        # Barre de recherche + raccourci /
│   │   ├── Filters.tsx          # Filtres catégorie/sous-catégorie/tri/reset
│   │   ├── BackgroundColorSelector.tsx # Couleur de fond de l'aperçu
│   │   ├── StatsBar.tsx         # Statistiques + tags populaires
│   │   ├── IconsGrid.tsx        # Grille responsive d'icônes
│   │   ├── IconCard.tsx         # Carte icône individuelle
│   │   ├── IconDetailModal.tsx  # Modal détail + téléchargement
│   │   ├── YotoMiniPreview.tsx  # Mini-preview latéral
│   │   ├── Pagination.tsx       # Pagination
│   │   ├── EmptyState.tsx       # État vide + reset
│   │   ├── ErrorState.tsx       # Échec de chargement + bouton Réessayer
│   │   ├── ErrorBoundary.tsx    # Filet de sécurité racine (erreurs de rendu)
│   │   ├── LoadingState.tsx     # Squelette de chargement
│   │   ├── Footer.tsx           # Pied de page
│   │   └── FavoriteButton.tsx   # Bouton favori (cœur)
│   ├── hooks/                   # Hooks personnalisés
│   │   ├── useIconsBrowser.ts   # État de navigation partagé (catalogue + pages filtrées)
│   │   ├── useFilteredIcons.ts  # Filtrage (Lunr + catégorie + sous-cat) + tri
│   │   ├── usePagination.ts     # Pagination (48/page)
│   │   ├── useUrlSync.ts        # Synchronisation URL <-> état
│   │   ├── useDebouncedSearch.ts# Debounce recherche (80ms)
│   │   └── useKeyboardShortcuts.ts # Raccourcis clavier
│   ├── pages/                   # Pages routées
│   │   ├── FavoritesPage.tsx    # /favorites
│   │   ├── CategoriesListPage.tsx # /categories
│   │   ├── CategoryIconsPage.tsx  # /categories/:category
│   │   ├── AuthorsListPage.tsx    # /authors
│   │   ├── AuthorIconsPage.tsx    # /authors/:artist
│   │   └── DevelopersPage.tsx     # /developers (doc API)
│   ├── i18n/                    # Contexte i18n + locales fr/en (bundlées)
│   ├── types/                   # Types + guards
│   │   ├── index.ts             # Icon, SummaryData, SortOption, FilterState
│   │   └── guards.ts            # assertIconArray
│   ├── utils/                   # urlParams, windowEvents, iconUtils
│   ├── constants/               # ICONS_PER_PAGE, DEBOUNCE_MS, CATALOGUE_BASE, catégories
│   ├── context/                 # Context React
│   │   ├── IconsDataContext.tsx # Chargement progressif (manifeste + shards) + moteur partagé
│   │   └── FavoritesContext.tsx # Favoris localStorage + sync inter-onglets
│   └── test/setup.ts            # Configuration Vitest (jest-dom, stub fetch)
├── dist/                        # Build production (GitHub Pages)
├── eslint.config.js             # Config ESLint flat
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts               # Config Vite + PWA (Workbox) + base path + Vitest
├── playwright.config.ts         # Config E2E
└── README.md
```

## Déploiement GitHub Pages

### Via GitHub Actions (recommandé)

Deux workflows racine (`.github/workflows/`) collaborent :

1. **`update-icons.yml`** (hebdomadaire) — lance les scrapers + `build:api` puis
   commit `data/` et `site/public/` (dont `summary.json` ; `index.json` et les
   shards `icons-by-source/` sont ignorés, cf. P1.3/P1.5).
2. **`deploy-pages.yml`** (sur push `main`) — régénère les données
   (`build:api` racine), build le frontend et publie `site/dist` via
   `actions/deploy-pages` (source Pages = **GitHub Actions**).

### Manuel

```bash
pnpm run build
# Puis publier le dossier dist/ (n'importe quel hébergeur statique)
```

**Important** : `vite.config.ts` configure `base: '/icons-catalogue/'`. L'URL finale sera `https://username.github.io/icons-catalogue/`.

Le PWA scope est `/icons-catalogue/` et start_url `/icons-catalogue/`.

## API de données

L'application charge le catalogue **progressivement** (servi sous
`/icons-catalogue/`, P1.3) :

1. `index.json` — Manifeste : sources publiées + compteurs + `catalogVersion`
2. `icons-by-source/{source}.json` — Un shard par source, chargés et fusionnés
   dans l'ordre croissant de taille (les icônes s'affichent dès le 1ᵉʳ shard)
3. `summary.json` — Statistiques globales (chargement non bloquant)

L'index de recherche Lunr est construit **une seule fois**, quand tous les shards
sont chargés. Le catalogue complet `icons.json` n'est **plus publié**.

### Format d'une icône

```json
{
  "id": "LZ0OGDaJz-Mbud5o3yDBBjeFvDHVdkSNTXIWogHZ0kw",
  "source": "yotoicons",
  "tags": ["moon", "night"],
  "artist": "@artistname",
  "title": "Titre de l'icône",
  "preview_image": "https://.../preview-16x16.png",
  "download_url": "https://.../icon-16x16.png",
  "category": "nature",
  "subcategory": "lune",
  "downloads": 123,
  "date_added": "2026-10-18T10:30:00Z",
  "license": "CC-BY-SA",
  "metadata": {
    "source_id": "2706",
    "content_encoding": "base64url",
    "duplicate_of": "yo-... (si doublon inter-sources)"
  }
}
```

**`id`** est un **identifiant de contenu** (`base64url(sha256(image))`, 43
caractères, canonique) : deux images aux octets identiques portent le même `id`.
L'identifiant **natif** de la source est dans **`metadata.source_id`** (uuid
yotopixels, id numérique yotoicons, `mediaId` officiel). Utilisez-le pour
retrouver une icône par sa provenance.

Les valeurs de `category` / `subcategory` sont des **slugs ASCII canoniques**
(sans accent), alignés sur `src/constants/categories.ts` (cf. `Icon` dans
`src/types/index.ts`).

### Format du résumé

```json
{
  "schemaVersion": 3,
  "catalogVersion": "2026.10.26-2",
  "updatedAt": "2026-10-26T10:40:59.217Z",
  "total": 27150,
  "counts": {
    "bySource": {
      "yotopixels": 1312,
      "yotoicons": 25319,
      "yoto-official": 519
    },
    "byCategory": {
      "objets": 7291,
      "animaux": 6657,
      "personnages": 6466
    },
    "byArtist": { "@artist": 123 },
    "bySubcategory": { "autre": 25000 },
    "topTags": { "moon": 450, "star": 320 },
    "topArtists": { "@artist": 123 }
  },
  "duplicates": {
    "groups": 45,
    "icons": 45,
    "content": { "groups": 409, "merged": 420 }
  }
}
```

> Les compteurs ci-dessus sont **illustratifs** : `summary.json` publié fait foi.
> `duplicates.groups`/`icons` = déduplication **sémantique** non destructive
> (titre + catégorie) ; `duplicates.content` = fusion des doublons de **contenu**
> exacts (icônes retirées du catalogue).

## Architecture des données et des hooks

### `IconsDataProvider` / `useIconsData` — Chargement progressif (contexte)
- Charge le manifeste (`getManifest`) puis les shards par source
  (`getSourceShard`), **dans l'ordre croissant de taille** (`planSourceOrder`) et
  les fusionne progressivement ; `summary.json` en parallèle (échec toléré)
- Valide la charge utile (garde de manifeste + `assertIconArray` par shard)
- `isLoading` passe à `false` **dès le premier shard** ; `isComplete` marque la fin
- Instancie le moteur de recherche partagé (`searchEngine`) **une seule fois**,
  après `isComplete`
- Dérive catégories, sous-catégories et mapping catégorie→sous-catégories (mémoïsé)
- Expose `error` (message du dernier échec de chargement, `null` si OK) et `reload()` (relance)
- Retourne : `icons`, `searchEngine`, `isLoading`, `isSearchReady`, `isComplete`, `error`, `reload`, `categories`, `subcategories`, `subcategoriesByCategory`, `summary`

### `useIconsBrowser` — État partagé des trois vues
- Compose `useFilteredIcons`, `usePagination`, `useUrlSync` et `useDebouncedSearch`
- Utilisé par le catalogue (`App.tsx`) et les pages catégorie/auteur (supprime la triplication)
- `lockedCategory` : catégorie imposée par la route (non réécrite dans l'URL)
- Retourne : filtres, `paginatedIcons`, `currentPage`, `totalPages`, `totalFiltered`, `hasActiveFilters` et handlers

### `useFilteredIcons` — Filtrage + tri (mémoïsé)
- Recherche Lunr si query + moteur prêt
- Filtre catégorie / sous-catégorie / source / licence
- Tri : downloads DESC, title ASC

### `usePagination` — Pagination
- 48 icônes/page (`ICONS_PER_PAGE`)
- Retourne : `paginatedIcons`, `currentPage`, `totalPages`, `totalFiltered`, `handlePageChange`, `setCurrentPage`

### `useUrlSync` — Synchronisation état → URL
- Écrit `q`, `cat`, `subcat`, `source`, `license`, `sort`, `page` à chaque changement
- `replaceState` pour ne pas polluer l'historique
- Lit les valeurs courantes via une ref (l'écriture étant débouncée, une closure directe resterait en retard d'un changement)
- La restauration initiale (`URL → état`) est faite par `useIconsBrowser` au montage

### `useDebouncedSearch` — Debounce 80ms
- Diffère `setQuery` et `syncUrl`
- Callback `onSearch` pour réinitialiser la page

### `useKeyboardShortcuts` — Raccourcis
- `/` → focus search input (sauf déjà dans un champ/modal)
- `Escape` → clear query / close modal / clear preview

### `FavoritesProvider` / `useFavorites` — Favoris (localStorage)
- Clé `yoto-icons-favorites` (array d'IDs)
- `favorites: Set<string>`, `isFavorite(id)`, `toggleFavorite(id)`, `addFavorite`, `removeFavorite`, `clearFavorites`
- Synchronisation inter-onglets via l'événement `storage`
- **Migration d'ids** : les favoris stockés référencent les `id` **de contenu**
  (`base64url(sha256)`, cf. racine `docs/analyse-id-sha256.md`). Les favoris
  enregistrés avant la bascule (anciens ids préfixés `yt-`/`yi-`/`yo-`) ne
  correspondent plus à aucune icône et apparaissent donc vides ; aucun
  re-association fiable n'est possible.

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

// Source unique de vérité : alignée sur `base` de vite.config.ts.
export const CATALOGUE_BASE = '/icons-catalogue';
export const MANIFEST_URL = `${CATALOGUE_BASE}/index.json`;
export function sourceShardUrl(source: string): string {
  return `${CATALOGUE_BASE}/icons-by-source/${source}.json`;
}
```

Les autres chemins d'API sont dérivés dans `src/api/client.ts` :

```typescript
export const API_BASE = CATALOGUE_BASE;
export const ENDPOINTS = {
  summary: `${API_BASE}/summary.json`,
  manifest: MANIFEST_URL,
  sourceShard: (source: string) => sourceShardUrl(source),
} as const;
```

## Dépendances principales

| Package | Version | Usage |
|---------|---------|-------|
| React | 18 | UI |
| React DOM | 18 | Rendering |
| React Router DOM | 7 | Routing SPA |
| Lunr.js | 2.3.9 | Full-text search client-side |
| Vite | 5 | Build tool + dev server |
| TypeScript | 5 | Typage statique |
| vite-plugin-pwa | latest | PWA + Workbox |

**Pas de framework CSS** — Styles CSS natifs avec variables personnalisées.

## PWA (Progressive Web App)

Configuré via `vite-plugin-pwa` + Workbox :

- **Manifest** : name, icons (72→512px), shortcuts (Favoris), scope `/icons-catalogue/`
- **Précache** : uniquement les assets applicatifs (~450 Ko) — **les données ne sont pas précachées** (P1.3)
- **Données** : cache runtime `catalogue-data` (`NetworkFirst`) → offline après la première visite
- **Stratégie** : `CacheFirst` pour fonts Google, `NetworkFirst` pour les données, assets précachés
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
- **Affichage progressif** : le catalogue est fusionné shard par shard ; la grille
  s'affiche dès le 1ᵉʳ shard reçu, l'index Lunr n'est construit qu'une fois tout chargé (P1.3)
- **Virtual scrolling** : Non (pagination 48/page), grille CSS simple

## Scripts disponibles

```bash
pnpm run dev            # Serveur de développement Vite
pnpm run build          # check:data + tsc + vite build + copie des données + dist/404.html
pnpm run preview        # Prévisualisation de la build de production
pnpm run check          # tsc --noEmit
pnpm run lint           # ESLint (config flat)
pnpm run lint:fix       # ESLint --fix
pnpm run format         # Prettier --write
pnpm run format:check   # Prettier --check
pnpm run test           # Vitest (run unique)
pnpm run test:watch     # Vitest en observation
pnpm run test:coverage  # Vitest + couverture (v8) + seuils
pnpm run test:e2e       # Playwright (build + vite preview :4173 + serveur type GitHub Pages :4174 + Chromium)
pnpm run check:bundle   # Budget de taille de bundle (gzip)
pnpm run check:i18n     # Parité fr/en + clés utilisées
pnpm run check:spa      # Vérifie que dist/404.html (repli SPA) est présent et à jour
pnpm run check:precache # Vérifie qu'aucune donnée n'est précachée par le SW
pnpm run check:data     # Vérifie que les données générées sont présentes
pnpm run verify         # lint + check + check:i18n + test + build + check:bundle + check:spa + check:precache
```

## Variables d'environnement

Aucune requise. L'application est 100% statique.

## Dépannage

### "Failed to fetch index.json" / shards
- Vérifier que `pnpm run build:api` a été lancé à la racine (ou `pnpm run update:all`)
- Depuis P1.3/P1.5, `public/index.json` et `public/icons-by-source/` ne sont plus versionnés : ils sont **générés** ; le build le signale via `check:data`
- Les fichiers sont copiés dans `site/public/` par `scripts/build-api.js`

### Index Lunr non chargé
- Vérifier la console pour erreurs de fetch
- L'index est reconstruit côté client une fois tous les shards chargés (le worker démarre après `isComplete`)

### PWA ne s'installe pas
- Servir en HTTPS (requis pour PWA)
- Vérifier `manifest.webmanifest` dans `dist/` (généré par vite-plugin-pwa)
- Vérifier `sw.js` enregistré (DevTools > Application > Service Workers)

### Styles cassés
- Pas de framework CSS, vérifier `src/styles.css` pour variables manquantes
- Build Vite minifie le CSS en production

## Licence

MIT — Code frontend uniquement. Les icônes restent la propriété de leurs auteurs respectifs.