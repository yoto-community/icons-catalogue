# Yoto Icons Catalogue

Catalogue unifié de **~27 150 icônes 16×16 pour Yoto Player**, réunissant trois
sources (yotopixels, yotoicons et les icônes officielles Yoto) dans une seule
interface : recherche full-text, filtres, favoris, téléchargement et un
**éditeur d'icônes 16×16** intégré. 100 % statique — sans compte ni backend — et
installable comme application.

**➡️ Accéder au catalogue** : `https://username.github.io/icons-catalogue/`

## Utilisation

Ouvrez simplement l'URL ci-dessus dans un navigateur : aucune installation ni
inscription n'est nécessaire.

### Rechercher une icône
- Tapez dans la barre de recherche : la grille se filtre instantanément sur le
  titre, l'artiste, la catégorie et les tags.
- Combinez avec les filtres **Catégorie**, **Sous-catégorie** (la seconde dépend
  de la première) et **Source** (yotopixels, yotoicons, yoto-official). La
  **provenance** de chaque icône (conditions déclarées par sa source) est
  affichée sur la fiche et récapitulée sur la page `/sources` ; elle n'a pas de
  filtre dédié, chaque source ayant une provenance unique.
- Choisissez le tri : **Téléchargements** (défaut) ou **Titre A-Z**.

### Parcourir
- `/categories` — toutes les catégories avec leur nombre d'icônes.
- `/authors` — tous les artistes avec leur nombre d'icônes.
- `/sources` — provenance, licences et attribution des icônes (menu **Communauté**).
- `/developers` — documentation de l'API statique et endpoints publiés (menu **Communauté**).
- Cliquez une icône pour ouvrir sa fiche (aperçu grand format, téléchargement et
  métadonnées). Un survol au clic droit (ou l'icône 🔍) ouvre un aperçu latéral rapide.

### Favoris
- Cliquez le **cœur** d'une icône pour l'enregistrer ; retrouvez-les sur `/favorites`.
- Les favoris restent dans votre navigateur (localStorage) — aucun compte requis.
- **Export en `.zip`** : téléchargez d'un coup les images de tous vos favoris.

### Créer / modifier une icône (éditeur)
- `/editor` (menu principal **Éditeur**) — éditeur de pixel art **16×16** pour le
  Yoto Player : crayon, gomme, remplissage, pipette, palette rapide, couleur
  personnalisée et réglage d'**opacité**.
- **Import d'image** : partez d'un fichier PNG/JPEG (converti automatiquement en
  16×16) ou, depuis la fiche d'une icône officielle, du bouton
  **« Retoucher dans l'éditeur »**.
- **Brouillon auto-sauvegardé** dans le navigateur (localStorage), restaurable ou
  jetable, et **export PNG 16×16**.
- Aides au dessin : compteur de couleurs, alerte au-delà de 8 couleurs (lisibilité)
  et alerte « noir pur » (invisible sur le fond noir du Player).
- Raccourcis : `p` crayon · `g` gomme · `f` remplissage · `b` pipette ·
  `1`–`9` palette · flèches pour déplacer le curseur · `Entrée`/`Espace` pour
  peindre · `Ctrl+Z` annuler · `Ctrl+Shift+Z` rétablir.

### Partager une recherche
L'URL reflète toujours la vue courante
(`?q=moon&cat=nature&source=yotoicons&sort=downloads&page=2`) :
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
| `Échap` | Quitter la recherche / fermer la fiche |

### Langues
Interface disponible en **français** et **anglais** (sélecteur dans l'en-tête).

## Sources & licences

| Source | Icônes | Provenance | Méthode |
|--------|--------|------------|---------|
| **yotopixels** | ~1 310 | Non précisé | API SvelteKit (`/search?q=&sort=newest&page=N`) |
| **yotoicons** | ~25 320 | Conditions de la source | Pagination HTML (`/icons?page=N`) |
| **yoto-official** | ~520 | Yoto — tous droits réservés | Bundle JS Astro (découvert depuis `/icons/using-icons/`) |

**Total : ~27 150 icônes unifiées**

Les icônes restent la propriété de leurs auteurs et/ou de Yoto. **Aucune de ces
sources ne place ses icônes sous une licence libre (CC/SPDX)** : la colonne
« Provenance » décrit les conditions réellement déclarées par chaque source
(vérifiées le 2026-10-26). Le catalogue ne concède aucun droit de réutilisation :
consultez les conditions de la source (page `/sources`) avant tout usage,
notamment commercial. Le code de
ce catalogue est sous licence MIT (voir [Licence](#licence)).

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
│   ├── update-readme-data.js       # Régénère la section « Données actuelles » du README
│   ├── check-readme-data.js        # Garde-fou CI : section README ↔ summary.json
│   ├── check-summary-sync.js       # Garde-fou CI : data/ ↔ summary.json (dérive)
│   └── lib/                        # Modules partagés + tests node:test
│       ├── taxonomy.js             # Catégories / sous-catégories canoniques (source unique)
│       ├── inferTags.js            # Inférence de tags depuis le titre
│       ├── rateLimiter.js          # fetch + reprise (backoff) + limitation de débit
│       ├── fetchWithTimeout.js     # fetch avec délai maximal
│       ├── yotopixels.js           # Parsing SvelteKit/HTML yotopixels (testée)
│       ├── yotoicons.js            # Parsing yotoicons (source unique, testée)
│       ├── yoto-official.js        # Découverte du bundle + parsing yoto.dev (testée)
│       ├── source-licenses.js      # Licences par source (source unique)
│       ├── content-id.js           # Identifiant de contenu base64url(sha256) (cf. docs/)
│       ├── image-hash.js           # Téléchargement + hachage des images (scrapers)
│       ├── content-dedupe.js       # Fusion canonique des doublons de contenu
│       ├── dedupe.js               # Détection des doublons inter-sources (marquage)
│       ├── catalog-version.js      # catalogVersion strictement croissante
│       ├── summary-sync.js         # Contrôle data/ ↔ summary.json (CI)
│       ├── catalogue-schema.js     # Validation des artefacts de build (schémas)
│       └── catalogue-guards.js     # Garde-fous build:api (sources présentes, anti-régression)
├── site/                           # Frontend React (Vite + TypeScript + PWA), déployé sur GitHub Pages
│   ├── src/
│   │   ├── components/             # Composants UI (IconsBrowser, Filters, Modal…) + editor/
│   │   ├── hooks/                  # Hooks personnalisés (useIconsBrowser, useFilteredIcons, …)
│   │   ├── pages/                  # Pages (Catalogue, Favoris, Catégories, Auteurs, Sources, Developers, Éditeur)
│   │   ├── context/                # IconsDataContext, FavoritesContext
│   │   ├── i18n/locales/           # Traductions fr/en (source unique, bundlée)
│   │   ├── types/                  # Types + guards TypeScript
│   │   └── constants/              # Constantes (ICONS_PER_PAGE, CATALOGUE_BASE, filtres, catégories, éditeur)
│   ├── public/                     # Fichiers servis sous /icons-catalogue/ (icons/, favicon.svg).
│   │                               # index.json et icons-by-source/ y sont *générés*
│   │                               # par `build:api` (non versionnés, cf. .gitignore) ;
│   │                               # summary.json, lui, reste versionné (marqueur de version).
│   ├── scripts/                    # check-bundle-size, check-i18n-keys, check-spa-fallback,
│   │                               # check-precache, check-data, check-seo, postbuild, generate-icons
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

> **Données générées** : `site/public/index.json` et
> `site/public/icons-by-source/` sont produits par `pnpm run build:api` (racine)
> et ne sont plus committés (cf. `.gitignore`) ; `site/public/summary.json`, lui,
> **reste versionné** (marqueur de `catalogVersion`). Lancez `build:api`
> **avant** le build du site (`cd site && pnpm run build`), sinon le build échoue
> avec un message explicite (`pnpm run check:data`).

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
# yotopixels, yotoicons, yoto-official, content-id, content-dedupe,
# source-licenses, catalog-version, summary-sync, catalogue-schema, dedupe,
# guards, readme-data)
pnpm test
```

`build:api` : attribue les licences par source, calcule les **identifiants de
contenu** (`base64url(sha256(image))`, cf. `docs/analyse-id-sha256.md`),
**fusionne les doublons de contenu exacts** (politique canonique : la source
prioritaire est publiée, les autres sont tracées), détecte les **doublons
inter-sources** sémantiques (marqués `metadata.duplicate_of` + comptés dans
`summary.duplicates`), incrémente `catalogVersion` et régénère la section
« Données actuelles » du README depuis `site/public/summary.json` (P0.5).

## Schéma de données commun

Chaque icône suit ce format normalisé. Deux identifiants cohabitent :
**`id`** = identifiant de **contenu** (`base64url(sha256(bytes de l'image))`,
43 caractères, canonique) et **`metadata.source_id`** = identifiant **natif** de
la source (provenance).

```json
{
  "id": "d1dFuvdzskXcC0uedCcrknLPHjvzTLLc9ouVyCDBCRg",
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
  "license": "Unspecified" | "Source terms" | "Proprietary",
  "metadata": {
    "source_id": "cb239825-6dd8-402e-b00b-a788ede40b07",
    "content_encoding": "base64url",
    "original_id": "...",
    "creator_id": "...",
    "numeric_id": "...",
    "detail_url": "...",
    "media_id": "...",
    "official": true,
    "duplicate_of": "id-de-l-icône-canonique",
    "merged_source_ids": ["id-natif-1", "id-natif-2"],
    "merged_count": 2
  }
}
```

> **`id` = contenu** : l'`id` canonique est le hash SHA-256 des octets de l'image,
> encodé en base64url (43 caractères) — le même modèle que le `mediaId` officiel
> Yoto (qui *est* déjà ce hash). Deux images aux octets identiques produisent donc
> le même `id`, quelle que soit la source. Utiliser **`metadata.source_id`** pour
> retrouver une icône par son identifiant d'origine.

> **`metadata.source_id`** : identifiant **natif** de la source — uuid
> `yotopixels`, id numérique `yotoicons`, `mediaId` `yoto-official` (pour cette
> dernière, `id == source_id == media_id`).

> **`date_added`** : date de **collecte** (horodatage du scrape) pour yotoicons et
> yoto-official, seule date réellement exposée par ces sources ; yotopixels
> fournit un `created_at` réel. Ce champ n'est donc **pas** une date de
> publication fiable : le tri par date a été retiré de l'UI.

> **`metadata.duplicate_of`** : présent uniquement quand le build a détecté un
> même visuel dans une autre source (titre + catégorie normalisés, 1 candidat max
> par source). La valeur est l'`id` de l'icône **canonique** (source prioritaire
> `yoto-official` > `yotopixels` > `yotoicons`). Aucune icône n'est supprimée.

> **`metadata.merged_source_ids` / `merged_count`** : présents quand plusieurs
> entrées partageaient le **même contenu** (octets identiques → même `id`). Une
> seule est publiée (la canonique) ; les autres sont retirées du catalogue mais
> leur provenance est conservée dans ces champs (et les groupes sont listés dans
> `summary.duplicates.content`).

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

pnpm run check:bundle   # Budget de taille de bundle (gzip)
pnpm run check:spa      # Repli SPA (dist/404.html présent et à jour)
pnpm run check:precache # Aucune donnée précachée par le service worker
pnpm run check:seo      # Balises SEO/partage (OG, Twitter, canonical) + robots.txt + sitemap.xml

pnpm run verify        # Tout en séquence : lint + check + check:i18n + test + build
                       #   + budget bundle + repli SPA + précache PWA + SEO
```

> **Ordre recommandé** : `eslint --fix` puis `prettier --write`. ESLint applique
> `consistent-type-imports` (sépare `import type`), que Prettier reformate ensuite
> proprement. Dans l'autre sens, les deux outils peuvent se contredire sur un même import.

> **E2E (Playwright)** : `test:e2e` construit la build de production, la sert via
> `vite preview`, puis exécute les specs `e2e/*.spec.ts` dans Chromium. Les données
> sont interceptées (fixture de 60 icônes dans `e2e/fixtures/`) : le parcours testé
> couvre le **Web Worker Lunr réel** (`aria-busy` passé à `false`), le filtrage de la
> grille après debounce, l'état vide, la pagination, les **favoris** (persistance
> localStorage + page dédiée), les **filtres** catégorie/sous-catégorie/source/tri, la
> **modale de détail** (clic, Échap, clic extérieur), les **raccourcis clavier**
> (`/`, Échap), la **bascule de langue**, le **repli SPA** (`404.html`) et
> l'**éditeur d'icônes** (`e2e/editor.spec.ts` : dessin, outils, export, brouillon).
> Un audit **axe-core** (`e2e/a11y.spec.ts`, normes WCAG A/AA) vérifie l'absence de
> violations sérieuses ou critiques sur onze scénarios : grille, menu « Réglages »,
> recherche filtrée, état vide, modale, favoris, pages développeurs / sources /
> auteur, et éditeur (rendu + peinture au clavier). Les animations sont désactivées
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
├── public/                     # Publié tel quel ; index.json et icons-by-source/
│   │                           #   sont GÉNÉRÉS par build:api (non versionnés,
│   │                           #   cf. .gitignore) ; summary.json reste versionné
│   ├── index.json              # Manifeste publié (sources, compteurs)
│   ├── summary.json            # Statistiques globales (versionné)
│   ├── icons-by-source/        # Shards par source (yotopixels, yotoicons, yoto-official)
│   ├── icons/                  # Icônes PWA (PNG 72→512)
│   └── favicon.svg
├── scripts/
│   ├── check-bundle-size.mjs   # Garde-fou de taille de bundle (gzip)
│   ├── check-i18n-keys.mjs     # Parité fr/en + détection des clés non utilisées
│   ├── check-spa-fallback.mjs  # Repli SPA (dist/404.html)
│   ├── check-precache.mjs      # Vérifie qu'aucune donnée n'est précachée (P1.3)
│   ├── check-data.mjs          # Données générées présentes avant le build (P1.5)
│   ├── check-seo.mjs           # Balises SEO/partage + robots.txt + sitemap.xml
│   ├── generate-icons.js       # Génère les PNG du PWA (72→512)
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

La construction de l'index Lunr coûte **~1,5 s** pour ~27 150 icônes. Deux
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
| `/sources` | Provenance, licences et attribution des icônes |
| `/developers` | Documentation de l'API statique |
| `/editor` | Éditeur d'icônes 16×16 (chargé à la demande) |

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

> `index.json` et `icons-by-source/*` sont **générés au build**
> (`pnpm run build:api`) et non versionnés ; `summary.json` est également généré
> mais **versionné** (marqueur de `catalogVersion`). Aucun de ces fichiers n'est
> **précaché** par le service worker (P1.3) : la PWA les met en cache à la
> première visite (cache runtime `catalogue-data`, réseau d'abord), puis les sert
> hors-ligne.

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
  "schemaVersion": 3,
  "catalogVersion": "2026.10.26-2",
  "updatedAt": "2026-10-26T10:40:59.217Z",
  "counts": {
    "total": 27150,
    "bySource": { "yotopixels": 1312, "yotoicons": 25319, "yoto-official": 519 },
    "byCategory": { "objets": 7291, "animaux": 6657, ... }
  },
  "sources": [{ "id": "yotopixels", "count": 1312 }, ...],
  "categories": [{ "id": "objets", "count": 7291 }, ...],
  "shards": [
    { "path": "icons.json", "type": "full", "count": 27150, "bytes": 21100370, "sha256": "..." },
    { "path": "icons-by-source/yotoicons.json", "type": "source", "source": "yotoicons", "count": 25319, ... },
    { "path": "icons-by-category/objets.json", "type": "category", "category": "objets", "count": 7291, ... }
  ],
  "searchIndex": { "path": "search-index.json", "bytes": 36543126, "sha256": "..." },
  "summary": { "path": "summary.json", "bytes": 48353, "sha256": "..." }
}
```

### Schéma d'une icône (entrée d'un shard ou de `icons.json`)

```json
{
  "id": "LZ0OGDaJz-Mbud5o3yDBBjeFvDHVdkSNTXIWogHZ0kw",
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
  "license": "Source terms",
  "metadata": {
    "source_id": "2706",
    "content_encoding": "base64url",
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
- Doublons **sémantiques** inter-sources marqués au build
  (`metadata.duplicate_of`, `summary.duplicates`, badge « Doublon ») : 45 groupes /
  45 icônes (P1.4) — **non destructif** (aucune icône supprimée). Le compteur peut
  varier légèrement d'un build à l'autre (fusion de contenu, nouveaux scrapes).
- Doublons de **contenu** exacts (octets identiques → même `id`) **fusionnés** au
  build (`summary.duplicates.content`, `metadata.merged_source_ids` /
  `merged_count`) : la canonique est publiée, les autres sont retirées du
  catalogue mais tracées (cf. `docs/analyse-id-sha256.md` §4.1)
- Icônes officielles Yoto : pas de compteur de téléchargements (fixé à 0)
- **Tags yotopixels** : les tags fournis par l'API sont conservés ; à défaut ils
  sont **inférés depuis le titre** (`scripts/lib/inferTags.js`, correspondance par
  mot entier). Chaque icône publiée porte donc au moins un tag ; la pertinence de
  la recherche full-text sur cette source dépend de la qualité des titres, pas du
  build.

## Données actuelles (dernier build)

- **Total** : 27 150 icônes
- **yotopixels** : 1 312
- **yotoicons** : 25 319
- **yoto-official** : 519
- **Doublons inter-sources** : 45 groupes / 45 icônes marquées
- **Doublons de contenu fusionnés** : 409 groupes / 420 icônes retirées

### Catégories principales
- `objets` : 7 291
- `animaux` : 6 657
- `personnages` : 6 466
- `nature` : 2 049
- `formes` : 1 904
- `transport` : 1 239
- `nourriture` : 1 027
- `batiments` : 382
- `fetes` : 49
- `musique` : 43
- `activites` : 28
- `emotions` : 15

> Ces compteurs proviennent du dernier build committé (`site/public/summary.json`,
> source de vérité). Le workflow hebdomadaire les régénère à chaque run.

## Licence

MIT — Les icônes restent la propriété de leurs auteurs respectifs (yotopixels, yotoicons, Yoto).