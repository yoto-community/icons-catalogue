# Yoto Icons Catalogue

Catalogue unifié de **~27 460 icônes 16×16 pour Yoto Player**, réunissant trois
sources (yotopixels, yotoicons et les icônes officielles Yoto) dans une seule
interface : recherche full-text, filtres, favoris et téléchargement. 100 %
statique — sans compte ni backend — et installable comme application.

**➡️ Accéder au catalogue** : `https://username.github.io/icons-catalogue/`

## Utilisation

Ouvrez simplement l'URL ci-dessus dans un navigateur : aucune installation ni
inscription n'est nécessaire.

### Rechercher une icône
- Tapez dans la barre de recherche : la grille se filtre instantanément sur le
  titre, l'artiste, la catégorie et les tags.
- Combinez avec les filtres **Catégorie**, **Sous-catégorie** (la seconde dépend
  de la première), **Source** (yotopixels, yotoicons, yoto-official) et
  **Licence** (CC-BY-SA, CC-BY-NC, Yoto Official).
- Choisissez le tri : **Téléchargements** (défaut) ou **Titre A-Z**.

### Parcourir
- `/categories` — toutes les catégories avec leur nombre d'icônes.
- `/authors` — tous les artistes avec leur nombre d'icônes.
- Cliquez une icône pour ouvrir sa fiche (aperçu grand format, téléchargement et
  métadonnées). Un survol au clic droit (ou l'icône 🔍) ouvre un aperçu latéral rapide.

### Favoris
- Cliquez le **cœur** d'une icône pour l'enregistrer ; retrouvez-les sur `/favorites`.
- Les favoris restent dans votre navigateur (localStorage) — aucun compte requis.

### Partager une recherche
L'URL reflète toujours la vue courante
(`?q=moon&cat=nature&source=yotoicons&license=CC-BY-NC&sort=downloads&page=2`) :
copiez-la pour partager exactement la même sélection.

### Installer l'application (PWA)
Le catalogue est une Progressive Web App : depuis votre navigateur, choisissez
« Installer » ou « Ajouter à l'écran d'accueil ». Il s'ouvre alors comme une
application. Les **données du catalogue** (~19 Mo) ne sont pas téléchargées à
l'installation : elles sont mises en cache à la **première visite** (stratégie
réseau d'abord), puis restent disponibles **hors-ligne**.

### Raccourcis clavier
| Raccourci | Action |
|-----------|--------|
| `/` | Placer le curseur dans la recherche |
| `Échap` | Effacer la recherche / fermer la fiche |

### Langues
Interface disponible en **français** et **anglais** (sélecteur dans l'en-tête).

## Sources & licences

| Source | Icônes | Licence | Méthode |
|--------|--------|---------|---------|
| **yotopixels** | ~1 310 | CC-BY-SA | API SvelteKit (`/search?q=&sort=newest&page=N`) |
| **yotoicons** | ~25 630 | CC-BY-NC | Pagination HTML (`/icons?page=N`) |
| **yoto-official** | ~520 | Yoto Official | Bundle JS Astro (découvert depuis `/icons/using-icons/`) |

**Total : ~27 460 icônes unifiées**

Les icônes restent la propriété de leurs auteurs : respectez les licences
(certaines interdisent l'usage commercial). Le code de ce catalogue est sous
licence MIT (voir [Licence](#licence)).

## Structure

```
icons-catalogue/
├── data/                           # Données brutes (committées)
│   ├── yotopixels-icons.json       # ~1 310 icônes
│   ├── yotoicons-icons.json        # ~25 630 icônes
│   └── yoto-official-icons.json    # ~520 icônes
├── dist/                           # API statique générée (non committée, cf. .gitignore)
│   ├── index.json                  # Manifeste du build (publié : entrées sources + compteurs)
│   ├── icons.json                  # Catalogue complet (local, NON publié depuis P1.3)
│   ├── summary.json                # Statistiques globales
│   ├── search-index.json           # Index Lunr.js sérialisé
│   ├── icons/{id}.json             # Métadonnées individuelles par icône
│   ├── icons-by-source/{source}.json   # Shards par source
│   ├── icons-by-category/{category}.json # Shards par catégorie
│   └── test-index.html             # Page de test générée
├── scripts/
│   ├── yotopixels-scraper.js       # Scraper yotopixels.com (API SvelteKit)
│   ├── yotoicons-scraper.js        # Scraper yotoicons.com (pagination HTML)
│   ├── yoto-official-scraper.js    # Scraper icônes officielles Yoto (bundle JS)
│   ├── build-api.js                # Génère dist/ puis copie les fichiers servis dans site/public
│   └── lib/                        # Modules partagés + tests node:test
│       ├── taxonomy.js             # Catégories / sous-catégories canoniques (source unique)
│       ├── inferTags.js            # Inférence de tags depuis le titre
│       ├── rateLimiter.js          # fetch + reprise (backoff) + limitation de débit
│       ├── yotoicons.js            # Parsing yotoicons (source unique, testée)
│       ├── yoto-official.js        # Découverte du bundle + parsing yoto.dev (testée)
│       ├── source-licenses.js      # Licences par source (source unique)
│       ├── catalog-version.js      # catalogVersion strictement croissante
│       ├── dedupe.js               # Détection des doublons inter-sources (marquage)
│       └── catalogue-guards.js     # Garde-fous build:api (sources présentes, anti-régression)
├── site/                           # Frontend React (Vite + TypeScript + PWA), déployé sur GitHub Pages
│   ├── src/
│   │   ├── components/             # Composants UI (IconsBrowser, Filters, Modal, etc.)
│   │   ├── hooks/                  # Hooks personnalisés (useIconsBrowser, useFilteredIcons, etc.)
│   │   ├── pages/                  # Pages (Catalogue, Favorites, Categories, Authors)
│   │   ├── context/                # IconsDataContext, FavoritesContext
│   │   ├── i18n/locales/           # Traductions fr/en (source unique, bundlée)
│   │   ├── types/                  # Types + guards TypeScript
│   │   └── constants/              # Constantes (ICONS_PER_PAGE, CATALOGUE_BASE, filtres, catégories)
│   ├── public/                     # Fichiers servis sous /icons-catalogue/ (icons/, favicon.svg).
│   │                               # index.json, icons-by-source/ et summary.json y sont
│   │                               # *générés* par `build:api` et ne sont plus versionnés (cf. .gitignore).
│   ├── scripts/                    # check-bundle-size, check-i18n-keys, check-spa-fallback,
│   │                               # check-precache, check-data, postbuild
│   ├── e2e/                        # Tests Playwright (parcours + audit a11y)
│   ├── dist/                       # Build production (publié par deploy-pages.yml)
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts              # Config Vite + PWA (Workbox) + Vitest
│   └── README.md
└── .github/workflows/              # ci.yml, update-icons.yml, deploy-pages.yml
```

## Installation

```bash
# Racine (scrapers + build)
cd icons-catalogue
pnpm install

# Frontend
cd site
pnpm install
```

> **Données générées, non versionnées** : `site/public/summary.json`,
> `site/public/index.json` et `site/public/icons-by-source/` sont produits par
> `pnpm run build:api` (racine) et ne sont plus committés. Lancez-le **avant** le
> build du site (`cd site && pnpm run build`), sinon le build échoue avec un
> message explicite (`pnpm run check:data`).

## Scripts (scraping & build)

```bash
# Scraper yotopixels uniquement
pnpm run scrape:yotopixels

# Scraper yotoicons uniquement
pnpm run scrape:yotoicons

# Scraper icônes officielles Yoto
pnpm run scrape:yoto-official

# Build API complète (3 scrapers + dist/ + copie vers site/public)
pnpm run update:all

# Build API uniquement (dist/ + copie vers site/public)
pnpm run build:api

# Régénère la section « Données actuelles » du README depuis summary.json
pnpm run update:readme

# Vérifie que cette section est à jour (garde-fou CI)
pnpm run check:readme

# Tests des modules partagés (node:test : taxonomy, inferTags, rateLimiter,
# yotoicons, yoto-official, source-licenses, catalog-version, dedupe, guards,
# readme-data)
pnpm test
```

`build:api` : attribue les licences par source, détecte les **doublons
inter-sources** (marqués `metadata.duplicate_of` + comptés dans
`summary.duplicates`), incrémente `catalogVersion` et régénère la section
« Données actuelles » du README depuis `site/public/summary.json` (P0.5).

## Schéma de données commun

Chaque icône suit ce format normalisé :

```json
{
  "id": "yt-artist-titre-icone",
  "source": "yotopixels" | "yotoicons" | "yoto-official",
  "tags": ["moon", "night", "nature"],
  "artist": "nom-artiste",
  "title": "Titre de l'icône",
  "preview_image": "https://.../preview-16x16.png",
  "download_url": "https://.../icon-16x16.png",
  "category": "objets|nature|animaux|musique|personnages|fetes|transport|activites|emotions|nourriture|batiments|formes",
  "subcategory": "lune|soleil|etoile|coeur|plante|chat|chien|oiseau|fleche|animal|vehicule|batiment|nourriture|musique|noel|halloween|anniversaire|autre",
  "downloads": 123,
  "date_added": "2026-10-18T10:30:00Z",
  "license": "CC-BY-SA" | "CC-BY-NC" | "Yoto Official",
  "metadata": {
    "original_id": "...",
    "creator_id": "...",
    "numeric_id": "...",
    "detail_url": "...",
    "media_id": "...",
    "official": true,
    "duplicate_of": "id-de-l-icône-canonique"
  }
}
```

> **`date_added`** : date de **collecte** (horodatage du scrape) pour yotoicons et
> yoto-official, seule date réellement exposée par ces sources ; yotopixels
> fournit un `created_at` réel. Ce champ n'est donc **pas** une date de
> publication fiable : le tri par date a été retiré de l'UI.

> **`metadata.duplicate_of`** : présent uniquement quand le build a détecté un
> même visuel dans une autre source (titre + catégorie normalisés, 1 candidat max
> par source). La valeur est l'`id` de l'icône **canonique** (source prioritaire
> `yoto-official` > `yotopixels` > `yotoicons`). Aucune icône n'est supprimée.

> **Taxonomie canonique** : `category` et `subcategory` sont attribuées par un
> classificateur unique et partagé (`scripts/lib/taxonomy.js`), aligné sur les
> libellés de l'UI (`site/src/constants/categories.ts`) et vérifié par
> un test. Les valeurs sont des **slugs ASCII sans accent** (URL et noms de
> fichiers sûrs). Un titre inconnu tombe sur `objets` / `autre`.

## Frontend (site)

Application React 18 + TypeScript + Vite 5 avec PWA (Workbox).

> Les fonctionnalités visibles (recherche, filtres, favoris, PWA…) sont décrites
> dans [Utilisation](#utilisation). Les sections ci-dessous portent sur le
> développement du frontend.

### Développement

```bash
cd site
pnpm install
pnpm run dev
# http://localhost:5173/icons-catalogue/
```

### Qualité (lint, formatage, tests)

La CI (`.github/workflows/ci.yml`) exécute ces mêmes commandes sur chaque PR :

```bash
cd site

pnpm run lint          # ESLint (config flat, règles TypeScript strictes)
pnpm run lint:fix      # Correction automatique
pnpm run format        # Prettier --write
pnpm run format:check  # Prettier --check (sans écriture)
pnpm run check         # tsc --noEmit (typage uniquement)
pnpm run check:i18n    # Parité fr/en + clés utilisées (scripts/check-i18n-keys.mjs)
pnpm run check:data    # Données du catalogue présentes (non versionnées, cf. P1.5)
pnpm run test          # Vitest (unit + intégration, environnement jsdom)
pnpm run test:watch    # Vitest en mode observation
pnpm run test:coverage # Couverture (v8) + seuils : échoue si la couverture régresse
pnpm run test:e2e      # Playwright : parcours complets + audit a11y (Chromium, build de prod)

pnpm run verify        # Tout en séquence : lint + check + check:i18n + test + build
                       #   + budget bundle + repli SPA + précache PWA
```

> **Ordre recommandé** : `eslint --fix` puis `prettier --write`. ESLint applique
> `consistent-type-imports` (sépare `import type`), que Prettier reformate ensuite
> proprement. Dans l'autre sens, les deux outils peuvent se contredire sur un même import.

> **E2E (Playwright)** : `test:e2e` construit la build de production, la sert via
> `vite preview`, puis exécute les specs `e2e/*.spec.ts` dans Chromium. Les données
> sont interceptées (fixture de 60 icônes dans `e2e/fixtures/`) : le parcours testé
> couvre le **Web Worker Lunr réel** (`aria-busy` passé à `false`), le filtrage de la
> grille après debounce, l'état vide, la pagination, les **favoris** (persistance
> localStorage + page dédiée), les **filtres** catégorie/sous-catégorie/source/licence/tri, la
> **modale de détail** (clic, Échap, clic extérieur), les **raccourcis clavier**
> (`/`, Échap) et la **bascule de langue**. Un audit **axe-core**
> (`e2e/a11y.spec.ts`, normes WCAG A/AA) vérifie l'absence de violations
> sérieuses ou critiques sur six scénarios : grille, résultats filtrés, état vide,
> modale, favoris et page développeurs. Les animations sont désactivées
> (`reducedMotion: 'reduce'`) pour des mesures déterministes. Prérequis unique :
> `pnpm exec playwright install chromium`.
> Les seuils de couverture (plancher global + verrous 100 % sur la logique pure)
> sont définis dans `vite.config.ts` et appliqués par la CI.

### Build production

```bash
# Prérequis (racine) — les données ne sont plus versionnées :
cd .. && pnpm install && pnpm run build:api && cd site

pnpm run build
# Sortie dans dist/
```

> `pnpm run build` commence par `check:data` : sans les fichiers générés dans
> `site/public/`, il échoue avec un message indiquant la commande à lancer.

### Structure du frontend

```
site/
├── public/                     # Publié tel quel ; summary.json, index.json et
│   │                           #   icons-by-source/ y sont GÉNÉRÉS par build:api
│   │                           #   (non versionnés, cf. .gitignore)
│   ├── index.json              # Manifeste publié (sources, compteurs)
│   ├── summary.json            # Statistiques globales
│   ├── icons-by-source/        # Shards par source (yotopixels, yotoicons, yoto-official)
│   ├── icons/                  # Icônes PWA (PNG 72→512)
│   └── favicon.svg
├── scripts/
│   ├── check-bundle-size.mjs   # Garde-fou de taille de bundle (gzip)
│   ├── check-i18n-keys.mjs     # Parité fr/en + détection des clés non utilisées
│   ├── check-spa-fallback.mjs  # Repli SPA (dist/404.html)
│   ├── check-precache.mjs      # Vérifie qu'aucune donnée n'est précachée (P1.3)
│   ├── check-data.mjs          # Données générées présentes avant le build (P1.5)
│   └── postbuild.mjs           # Génère dist/404.html
├── e2e/                        # Tests Playwright (parcours + audit axe-core)
├── src/
│   ├── main.tsx                # Point d'entrée + providers (i18n, données, favoris)
│   ├── App.tsx                 # Routes + état modal global
│   ├── styles.css              # Styles CSS natifs (variables CSS)
│   ├── searchIndex.ts          # Construction de l'index Lunr (partagé)
│   ├── searchEngine.ts         # Moteur de recherche (worker + repli main-thread)
│   ├── workers/
│   │   └── searchIndex.worker.ts  # Construction/conserve l'index hors main thread
│   ├── context/
│   │   ├── IconsDataContext.tsx   # Chargement des icônes UNE fois + moteur partagé
│   │   └── FavoritesContext.tsx   # Favoris localStorage + sync inter-onglets
│   ├── hooks/                  # useIconsBrowser, useFilteredIcons, usePagination, useUrlSync, …
│   ├── components/             # UI (IconsBrowser, Header, IconsGrid, BackLink, …)
│   ├── pages/                  # Routes (Catalogue, Catégories, Auteurs, …)
│   ├── constants/              # Libellés/icônes de catégories + CATALOGUE_BASE
│   ├── i18n/                   # Contexte i18n + locales fr/en (bundlées)
│   ├── api/client.ts           # Client HTTP + classe ApiError typée
│   ├── types/                  # Types + guards (assertIconArray)
│   ├── utils/                  # urlParams, windowEvents, iconUtils
│   └── test/setup.ts           # Configuration Vitest (jest-dom, stub fetch)
├── dist/                       # Build production (GitHub Pages)
├── eslint.config.js            # Config ESLint flat
├── index.html
├── package.json
├── tsconfig.json               # strict: true
└── vite.config.ts              # base: '/icons-catalogue/', PWA config, config Vitest
```

### Architecture de la recherche (performance)

La construction de l'index Lunr coûte **~1,5 s** pour ~27 460 icônes. Deux
mécanismes évitent que ce coût pénalise l'utilisateur :

1. **Web Worker** (`searchIndex.worker.ts`) — l'index est construit et conservé
   hors du main thread. Aucune frame n'est gelée à l'ouverture ; seules les
   requêtes et les listes d'IDs circulent (aucun coût de sérialisation de l'index).
   En cas d'échec de chargement du worker, `searchEngine.ts` bascule
   automatiquement sur un index construit sur le main thread.
2. **Contexte unique** (`IconsDataContext`) — le manifeste puis les shards par
   source sont fusionnés **progressivement** (le premier shard affiche la grille),
   et l'index est construit **une seule fois** quand tout est chargé. Précédemment,
   `App` et chaque page reconstruisaient chacun leur propre index.

La recherche est devenue **asynchrone** : `useFilteredIcons` stocke les IDs
retournés par le moteur en état et les réapplique au filtre.

### Routes

| Route | Description |
|-------|-------------|
| `/` | Catalogue principal (recherche + filtres) |
| `/favorites` | Icônes favorites (localStorage) |
| `/categories` | Liste des catégories avec compteurs |
| `/categories/:category` | Icônes d'une catégorie |
| `/authors` | Liste des artistes avec compteurs |
| `/authors/:artist` | Icônes d'un artiste |

### Personnalisation

**Couleurs (CSS variables dans `src/styles.css`)**
```css
:root {
  --color-primary: #e94560;
  --color-primary-dark: #c0392b;
  --color-background: #f8f9fa;
  --color-surface: #ffffff;
  /* ... */
}
```

**Icônes par page** : Modifier `ICONS_PER_PAGE` dans `src/constants/index.ts` (défaut: 48)

**Délai debounce recherche** : Modifier `DEBOUNCE_MS` dans `src/constants/index.ts` (défaut: 80ms)

## Déploiement GitHub Pages

### Workflows

Le dépôt fournit trois workflows (`.github/workflows/`) :

| Workflow | Déclencheur | Rôle |
|----------|-------------|------|
| `ci.yml` | push / PR sur `main` | Lint, Prettier, typecheck, i18n, tests + couverture, build, budget de bundle, syntaxe+`node:test` des scripts (racine) et E2E Playwright |
| `update-icons.yml` | cron hebdomadaire (lundi 4h UTC) + manuel | `pnpm run update:all` (scrapers + `build:api`) puis commit de `data/` et `site/public/` |
| `deploy-pages.yml` | push sur `main` + manuel | Build de `site` et publication de `site/dist` sur GitHub Pages |

Le dossier racine `dist/` n'est **pas** committé (cf. `.gitignore`) : il sert
d'intermédiaire local. Les artefacts servis volumineux (`index.json` + les shards
`icons-by-source/*`, ~18 Mo au total) ne sont **pas versionnés** non plus : ils
sont régénérés depuis `data/` par `pnpm run build:api` (racine) avant chaque
build — `deploy-pages.yml` et le job `quality` de `ci.yml` exécutent cette étape.
`summary.json` reste versionné (marqueur de `catalogVersion`). `build:api` copie
les fichiers servis dans `site/public/`, puis la build Vite les inclut et
`deploy-pages.yml` publie `site/dist`. L'index de recherche
(`dist/search-index.json`) n'est **plus publié** (P1.3) : il reste disponible dans
le `dist/` local, le front reconstruit son index depuis les shards par source.
Le catalogue complet `dist/icons.json` n'est **plus publié** (P1.3) non plus.

Activer GitHub Pages avec la source **GitHub Actions** (Settings → Pages).
URL finale : `https://username.github.io/icons-catalogue/`.

## API Statique

L'API est 100% statique, servie via GitHub Pages sous
`https://username.github.io/icons-catalogue/`. Aucun backend requis.

### Endpoints publiés

Ces fichiers sont copiés dans `site/public/` par `build:api`, donc publiés tels
quels :

| Endpoint | Description |
|----------|-------------|
| `GET /icons-catalogue/summary.json` | Statistiques (source de vérité de l'UI) |
| `GET /icons-catalogue/index.json` | Manifeste : sources publiées, compteurs, `catalogVersion` |
| `GET /icons-catalogue/icons-by-source/{source}.json` | Shard d'une source (`yotopixels`, `yotoicons`, `yoto-official`) |

> Depuis P1.3, le front charge le manifeste puis les shards **progressivement**
> (ordre croissant de taille) et affiche les icônes **dès le premier shard reçu**,
> sans attendre la fin du téléchargement. Le catalogue complet `icons.json`
> n'est **plus publié** : le volume total est équivalent, mais il imposait
> d'attendre la fin du plus gros transfert avant le premier affichage.

> Ces fichiers sont **générés au build** (`pnpm run build:api`), non versionnés.
> Ils ne sont **pas précachés** par le service worker (P1.3) : la PWA les met en
> cache à la première visite (cache runtime `catalogue-data`, réseau d'abord),
> puis les sert hors-ligne.

> Les métadonnées individuelles par icône (`dist/icons/{id}.json`), les shards
> par catégorie (`dist/icons-by-category/{category}.json`), le catalogue complet
> (`dist/icons.json`) et l'index de recherche (`dist/search-index.json`) ne sont
> générés que dans le `dist/` **local** : ils ne sont **pas publiés** sur GitHub
> Pages (cf. section suivante). Le front reconstruit son index Lunr depuis les
> shards une fois le catalogue complet chargé.

### Artefacts locaux supplémentaires (générés dans `dist/`, non publiés)

`build:api` produit en plus, dans le `dist/` local, le catalogue complet et des
shards par catégorie. Utiles en local ou si vous hébergez `dist/` vous-même :

| Fichier (`dist/`) | Description |
|-------------------|-------------|
| `icons.json` | Catalogue complet (local, non publié) |
| `search-index.json` | Index Lunr sérialisé (local, non publié) |
| `icons-by-category/{category}.json` | Icônes d'une catégorie (`objets`, `animaux`, `nature`, …) |

### Exemples d'utilisation

**Lister toutes les icônes (via le manifeste + les shards) :**
```bash
# 1. Le manifeste indique les sources publiées et leurs compteurs
curl https://username.github.io/icons-catalogue/index.json

# 2. Un shard par source (concaténables dans l'ordre voulu)
curl https://username.github.io/icons-catalogue/icons-by-source/yotoicons.json
```

**Recherche full-text côté client (avec Lunr.js) :**
```javascript
import lunr from 'lunr';

// Aucun index n'est hébergé : chargez le manifeste, puis tous les shards,
// et reconstruisez l'index une fois le catalogue complet.
const manifest = await fetch('/icons-catalogue/index.json').then(r => r.json());

const shards = await Promise.all(
  manifest.sources.map(s =>
    fetch(`/icons-catalogue/icons-by-source/${s.id}.json`).then(r => r.json())
  )
);
const icons = shards.flat();

const index = lunr(function () {
  this.ref('id');
  this.field('title');
  this.field('tags', { boost: 10 });
  this.field('artist');
  icons.forEach(icon => this.add(icon));
});

const results = index.search('moon night');
const iconIds = results.map(r => r.ref); // IDs des icônes correspondantes
```

**Charger les statistiques :**
```bash
curl https://username.github.io/icons-catalogue/summary.json
```

### Structure du manifeste (`index.json`)

Le manifeste publié décrit tout le build ; seules les entrées `sources`,
`counts` et `summary` correspondent à des fichiers réellement publiés (les
entrées `shards` listent aussi les artefacts locaux non publiés).

```json
{
  "schemaVersion": 2,
  "catalogVersion": "2026.10.21-1",
  "updatedAt": "2026-10-21T09:19:04.329Z",
  "counts": {
    "total": 27460,
    "bySource": { "yotopixels": 1314, "yotoicons": 25627, "yoto-official": 519 },
    "byCategory": { "objets": 8196, "animaux": 6375, ... }
  },
  "sources": [{ "id": "yotopixels", "count": 1314 }, ...],
  "categories": [{ "id": "objets", "count": 8196 }, ...],
  "shards": [
    { "path": "icons.json", "type": "full", "count": 27460, "bytes": 18719413, "sha256": "..." },
    { "path": "icons-by-source/yotoicons.json", "type": "source", "source": "yotoicons", "count": 25627, ... },
    { "path": "icons-by-category/objets.json", "type": "category", "category": "objets", "count": 8196, ... }
  ],
  "searchIndex": { "path": "search-index.json", "bytes": 28378191, "sha256": "..." },
  "summary": { "path": "summary.json", "bytes": 48517, "sha256": "..." }
}
```

### Schéma d'une icône (entrée d'un shard ou de `icons.json`)

```json
{
  "id": "yi-allisonhopes-2706",
  "source": "yotoicons",
  "tags": ["bluey", "animals"],
  "artist": "@allisonhopes",
  "title": "Bluey",
  "preview_image": "https://www.yotoicons.com/static/uploads/2706.png",
  "download_url": "https://www.yotoicons.com/static/uploads/2706.png",
  "category": "animaux",
  "subcategory": "animal",
  "downloads": 13652,
  "date_added": "2026-10-21T08:21:25.945Z",
  "license": "CC-BY-NC",
  "metadata": {
    "numeric_id": "2706",
    "source_category": "animals",
    "detail_url": "https://www.yotoicons.com/icons?tag=Bluey"
  }
}
```

### Intégration dans une application

L'API est conçue pour être consommée par n'importe quel client (React, Vue, vanilla JS, mobile, etc.) :

1. **Catalogue** : `GET /icons-catalogue/index.json` (manifeste) puis `GET /icons-catalogue/icons-by-source/{source}.json` pour chaque source → concaténation de toutes les icônes (affichage possible dès le premier shard)
2. **Statistiques** : `GET /icons-catalogue/summary.json` → compteurs (sources, catégories, artistes, top tags)
3. **Recherche** : reconstruisez l'index Lunr.js côté client après avoir chargé tous les shards (aucun index hébergé)
4. **Découverte avancée** : générez `dist/` localement (`pnpm run build:api`) pour obtenir `icons.json` (catalogue complet), l'index de recherche (`search-index.json`), les métadonnées par icône (`icons/{id}.json`) et les shards par catégorie (non publiés sur GitHub Pages)

## Fonctionnalités de recherche (détail technique)

- **Moteur** : Lunr.js 2.3.9 (côté client)
- **Champs indexés** : `tags` (boost 10), `artist`, `title`, `category`, `subcategory`
- **Index serveur** : sérialisé en `dist/search-index.json` par `pnpm run build:api` (local, non publié)
- **Index client** : reconstruit dans un Web Worker **une seule fois**, après le chargement complet des shards (repli main-thread si le worker échoue)
- **Pas de backend requis** — 100% statique (fichiers JSON)

## Notes techniques

- Les scrapers utilisent les sélecteurs CSS / patterns actuels des sites
- Si la structure HTML/JS change, mettre à jour les sélecteurs dans `scripts/*.js`
- La classification catégorie/sous-catégorie est centralisée dans `scripts/lib/taxonomy.js` (testée par `pnpm test`)
- Le frontend charge le manifeste puis les shards par source progressivement et reconstruit l'index Lunr côté client une fois le catalogue complet
- Le service worker ne précache que les assets applicatifs (~450 Ko) ; les
  données (`index.json`, `icons-by-source/*`, `summary.json`) passent par un cache
  **runtime** `NetworkFirst` (`catalogue-data`) : offline après la première visite (P1.3)
- Les gros artefacts générés (shards `icons-by-source/*`, `icons.json`) ne sont
  **pas** versionnés : ils sont régénérés au build (P1.5). L'index de recherche
  (`dist/search-index.json`) et le catalogue complet `dist/icons.json` ne sont
  **pas publiés** (P1.3).
- Doublons inter-sources marqués au build (`metadata.duplicate_of`,
  `summary.duplicates`, badge « Doublon ») : 45 groupes / 45 icônes (P1.4)
- Icônes officielles Yoto : pas de compteur de téléchargements (fixé à 0)
- **yotopixels ne fournit des `tags` que pour ~49 % de ses icônes** (643/1314) :
  la recherche full-text y est donc moins pertinente. Corriger cela demande
  d'enrichir le scraper yotopixels, pas le build.

## Données actuelles (dernier build)

- **Total** : 27 570 icônes
- **yotopixels** : 1 314
- **yotoicons** : 25 737
- **yoto-official** : 519
- **Doublons inter-sources** : 46 groupes / 46 icônes marquées

### Catégories principales
- `objets` : 7 399
- `animaux` : 6 752
- `personnages` : 6 545
- `nature` : 2 087
- `formes` : 1 974
- `transport` : 1 247
- `nourriture` : 1 040
- `batiments` : 391
- `fetes` : 49
- `musique` : 43
- `activites` : 28
- `emotions` : 15

> Ces compteurs proviennent du dernier build committé (`site/public/summary.json`,
> source de vérité). Le workflow hebdomadaire les régénère à chaque run.

## Licence

MIT — Les icônes restent la propriété de leurs auteurs respectifs (yotopixels, yotoicons, Yoto).