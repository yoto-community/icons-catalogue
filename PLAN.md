# Plan d'amélioration — `icons-catalogue`

> Analyse vérifiée du dépôt — **2026-10-21**.
> Chaque tâche est cochable (`[ ]` → `[x]`). Priorités : **P0** (correctness /
> bloquant), **P1** (données & API), **P2** (qualité & contributivité),
> **P3** (confort UX). Les constats marqués *(vérifié)* ont été reproduits à la
> main sur le dépôt (commandes, comptages, inspection d'artefacts).

## Contexte

Catalogue unifié d'icônes 16×16 Yoto, issu de 3 sources (`yotopixels`,
`yotoicons`, `yoto-official`). Chaîne :
`scrapers → data/ → build-api.js → dist/ + site/public/ → front React/Vite/PWA
sur GitHub Pages`.

## État vérifié (2026-10-21)

| Indicateur | Valeur réelle | Commentaire |
|-----------|---------------|-------------|
| Total icônes | **27 460** | `data/*.json` (yotopixels 1 314, yotoicons 25 627, yoto-official 519) |
| Tests front | **348 passent** (50 fichiers) | `pnpm run test` (site) |
| Tests scripts | **135 passent** | `pnpm test` (racine, `node:test`) |
| Tests E2E | **33 passent** | `pnpm run test:e2e` (dont 3 pour le repli SPA, P0.1, et 5 pour le lot P3) |
| Couverture | **97,9 % st. / 93,6 % br. / 95,4 % fn. / 97,9 % lignes** | seuil configuré : **90 / 85 / 85 / 90** + verrous par module |
| Bundle front | **105,9 Ko** | budget **130 Ko** (`check:bundle`) |
| `lint` / `tsc` / `check:i18n` | **OK** | 248 clés fr/en alignées |
| Classification | `objets/autre` = **26,1 %** | P0.1 historique réglé (était 98 %) |
| Docs | README = **27 460** / `objets` 8 196 | **aligné** + section « Données actuelles » auto-générée (P0.5) |

---

## P0 — Correctness (à traiter en premier)

### P0.1 — Liens profonds 404 sur GitHub Pages *(vérifié)*
Aucun `404.html` n'est généré (`site/public/` et `site/dist/` n'en contiennent
pas). Or GitHub Pages **ne fait pas de repli SPA** : ouvrir ou recharger
directement `/icons-catalogue/categories`, `/authors`, `/favorites`,
`/developers` renvoie une **404**. La navigation interne fonctionne (Routing
côté client), donc le bug passe inaperçu en dev (`vite dev`/`preview` font le
repli) et n'est pas couvert par les E2E.

- [x] Copier `site/dist/index.html` → `site/dist/404.html` en fin de build
  (`site/scripts/postbuild.mjs`, branché sur le script `postbuild` appelé par
  `build`). Contrôle dédié `check:spa` (dans `verify` et la CI) + étape CI.
  *Critère : charger directement `/categories` sert l'app.*
- [x] Ajouter un test E2E qui navigue **directement** vers une route profonde.
  `site/e2e/serve-dist.mjs` imite GitHub Pages (404 + corps de `404.html`) car
  `vite preview` masquerait la régression ; `site/e2e/spa-fallback.spec.ts`
  vérifie route profonde, URL inconnue et fichier réel. **3 E2E verts.**

### P0.2 — Échecs silencieux au chargement des données *(vérifié)*
`IconsDataContext.tsx` (l. 69-73) attrape l'erreur de `fetch(icons.json)` et se
contente d'un `console.error` : `isLoading` repasse à `false` avec `icons = []`.
L'utilisateur voit donc un **état vide ambigu** (« aucun résultat »), sans
message d'erreur ni bouton *Réessayer*. Aucun `ErrorBoundary` n'existe.

- [x] Exposer un état `error` dans `IconsDataContext` et afficher un message
  dédié + bouton *Réessayer* (distinct de l'`EmptyState` « 0 résultat »).
  Fait : `error` + `reload()` exposés, `components/ErrorState.tsx`, message
  d'erreur affiché par `App.tsx` quand `error && icons.length === 0`.
- [x] Ajouter un `ErrorBoundary` racine (écran de secours en cas d'exception de
  rendu). Fait : `components/ErrorBoundary.tsx`, branché dans `main.tsx`
  (sous `I18nProvider`). Tests : contexte (3), `ErrorState` (2),
  `ErrorBoundary` (2), `App` (1).

### P0.3 — Scraper yoto-official fragile *(vérifié)*
`scripts/yoto-official-scraper.js` (l. 15) code en dur une URL de bundle
**versionnée par hash de contenu** :
`https://yoto.dev/_astro/Icons.kDw8Dzu-.js`. À chaque redéploiement de
`yoto.dev`, le hash change → le scraper échoue (ou pire, récupère un bundle
différent). Aucun test ne couvre ce scraper.

- [x] Découvrir dynamiquement l'URL du bundle (parser la page
  `/icons/using-icons/` pour trouver le `Icons.*.js` courant). Fait :
  `scripts/lib/yoto-official.js` (`findBundleUrl`, testé) ; le scraper ne code
  plus aucun hash en dur.
- [x] Échouer explicitement avec un message clair si la structure change.
  `extractRawIcons` lève une erreur explicite si le motif `JSON.parse(...)`
  disparaît. **13 tests** couvrent le module (`yoto-official.test.js`).

### P0.4 — `build-api.js` publie un catalogue partiel en silence *(vérifié)*
`loadJSON()` (l. 23-30) renvoie `[]` quand `data/<source>.json` est absent et se
contente d'un `console.warn`. Le build réussit alors avec une source manquante :
un run hebdomadaire où un scraper a échoué **écrase `site/public/` par un
catalogue amputé**, committé et déployé.

- [x] Faire **échouer** `build:api` (`process.exit(1)`) si une source attendue est
  absente ou vide (`loadRequiredJSON` + `assertSourcesPresent`). *Vérifié :*
  source renommée → `exit=1` avec message explicite, sans écriture d'artefact.
- [x] Idem si `allIcons.length` régresse fortement (`assertNoRegression`, seuil
  −5 % vs `site/public/summary.json`), override `ALLOW_CATALOGUE_SHRINK=1`.
  Module `scripts/lib/catalogue-guards.js` (testé, 9 tests).

### P0.5 — Dérive docs ↔ réalité *(vérifié)*
- Le README racine (l. 372) et `test-index.html` (généré par `build-api.js`,
  l. 351) annoncent `GET /icons-catalogue/icons/{id}.json` : cet endpoint
  **n'est pas publié** (`build-api.js` ne copie pas `dist/icons/` vers
  `site/public/`). `site/public/icons/` ne contient que les PNG du PWA.
- Les compteurs du README (l. 493-517) datent d'un ancien build (27 399 / objets
  26 893).
- La description dans `site/index.html` et `site/public/manifest.json` omet
  `yoto-official` (« yotopixels et yotoicons »).

- [x] Aligner README + `test-index.html` sur la réalité (endpoints publiés,
  compteurs, 3 sources). Fait : compteurs 27 460 / `objets` 8 196, table de
  licences, manifeste, schéma d'icône ; `icons/{id}.json` retiré des endpoints
  *publiés* (marqué local uniquement) dans le README **et** `build-api.js`.
  `site/README.md` aligné (compteurs, arborescence, scripts, `error`/`reload`).
  Descriptions (`site/index.html`, `site/public/manifest.json`) mentionnent les
  3 sources.
- [x] Générer automatiquement la section « Données actuelles » depuis
  `summary.json`. Fait (P0.5) : module pur `scripts/lib/readme-data.js`
  (+ 10 tests `node:test`), CLI `scripts/update-readme-data.js`
  (`pnpm run update:readme`) et garde-fou `scripts/check-readme-data.js`
  (`pnpm run check:readme`) ; `build:api` régénère la section (source de
  vérité `site/public/summary.json`), garde-fou rejoué en CI et README ajouté
  au commit du workflow hebdomadaire.

### P0.6 — Licence yotopixels à vérifier *(vérifié — incohérence interne)*
Les données portaient `license: "CC-BY-SC"` (`yotopixels-scraper.js` l. 83,
README l. 55), alors que les locales i18n (fr/en) citent **`CC-BY-SA`**.
`CC-BY-SC` n'existe ni chez Creative Commons ni en SPDX.

- [x] Vérifier la licence réelle affichée par yotopixels et corriger la source
  unique (`license` dans le scraper + README + locales).
  **Constat (web, 2026-10-21)** : yotopixels.com ne publie **aucune licence**
  (accueil, `/search`, page d'icône, `/privacy` ; `/about` et `/terms` → 404).
  Décision (utilisateur) : normaliser en **`CC-BY-SA`** (valeur déjà citée par
  l'UI). Nouveau module unique `scripts/lib/source-licenses.js` appliqué par les
  3 scrapers/libs **et** par `build-api.js` (re-normalise les données committées
  sans re-scrape) ; `data/yotopixels-icons.json`, README et locales alignés.
  *Limite : choix à confirmer auprès de l'auteur de yotopixels.*

---

## P1 — Données & API

### P1.1 — `date_added` non représentative : tri « Date » inexploitable *(vérifié)*
`yotoicons` : **1 021 valeurs distinctes pour 25 627 icônes** (c'est
l'horodatage du scraping, cf. `toNormalizedIcon(..., scrapedAt)`).
`yoto-official` : **14 valeurs pour 519**. Seul `yotopixels` a une vraie date
(`created_at`, 1 314 valeurs distinctes). Le tri « Plus récent » est donc
quasi arbitraire pour 95 % du catalogue.

- [x] Extraire la vraie date de mise en ligne côté yotoicons/officiel si elle est
  exposée. → **aucune exposée** (cf. enquête ci-dessous).
- [x] À défaut : retirer l'option de tri « Date ».

**Enquête (2026-10-21) — aucune vraie date exposée :**

- `yoto-official` : le bundle (`/_astro/Icons.<hash>.js`) n'expose que
  `mediaId`, `title`, `url`, `publicTags` → pas de date.
- `yotoicons` : la page liste n'expose que
  `populate_icon_modal(id, catégorie, tag1, tag2, auteur, téléchargements)`
  → pas de date. **Mais** le tri `sort=new` renvoie les `numeric_id` par ordre
  décroissant (`35023`, `35022`, …) : l'id numérique est donc **monotone avec la
  création** → proxy de récence exploitable pour yotoicons.
- `yotopixels` : `created_at` réel (inchangé).

**Livré (2026-10-21) :** option de tri « Date » retirée (`SortOption` =
`downloads | title`, `SORT_OPTIONS`, sélecteur, clés i18n obsolètes supprimées).
Le libellé du détail passe de « Ajoutée le » à « Collectée le » (« Collected on »)
— plus honnête, `date_added` étant pour 95 % du catalogue l'horodatage du scrape.

### P1.2 — Filtres par **source** et par **licence** dans l'UI
Trois sources et trois licences distinctes (CC-BY-SA, CC-BY-NC, Yoto Official)
ne sont pas filtrables : seuls des badges d'affichage existent
(`IconCard.tsx`, `IconDetailModal.tsx`). `Filters.tsx` n'a que
catégorie / sous-catégorie / tri.

- [x] Ajouter `source` et `license` au `FilterState`, à `useFilteredIcons`, à
  `useUrlSync` (URL : `?source=…&license=…`) et à `Filters.tsx`.

**Livré (2026-10-21) :** constantes `SOURCE_OPTIONS`/`LICENSE_OPTIONS`/
`getSourceLabel` (`site/src/constants/filters.ts`), validateurs
`toSourceFilter`/`toLicenseFilter` (`urlParams.ts`), filtres dans
`useFilteredIcons`, état + restauration URL + `hasActiveFilters`/reset dans
`useIconsBrowser`, sélecteurs `SourceFilter`/`LicenseFilter` et clés i18n
fr/en. Correction au passage d'un bug de synchronisation d'URL : `syncUrl`
capturait les valeurs d'un rendu périmé (l'URL restait en retard d'un
changement) → lecture via ref. Unitaires +5 (211), E2E +2 (28).

### P1.3 — Poids du premier chargement / PWA *(livré)*
- `site/public/icons.json` = **18,7 Mo**, précaché par Workbox
  (`globPatterns` inclut `json`) → installation PWA très lourde.
- `dist/` contient déjà des **shards par source/catégorie** + `index.json`, mais
  ils **ne sont pas publiés** (`build:api` ne copie que `icons.json`,
  `summary.json`, `lunr-index.bin`).
- `site/public/lunr-index.bin` = **28,4 Mo**, publié « pour les consommateurs »
  mais **jamais utilisé par le front** (qui reconstruit l'index depuis
  `icons.json`).

- [x] Publier `index.json` + shards par source et faire charger les données par
  shard (chargement progressif côté front).
- [x] Trancher sur `lunr-index.bin` : le **retirer de la publication** (P1.3).

**Livré (2026-10-21) :** `globPatterns` n'inclut plus `json` → `icons.json` et
`summary.json` ne sont **plus précachés** ; ils passent par une règle de cache
*runtime* `NetworkFirst` (`catalogue-data`) : mis en cache à la première visite,
disponibles hors-ligne ensuite. Précache : **18 777 Ko → 449 Ko**.
Garde-fou `check:precache` (intégré à `verify` et à la CI).

**Tranché (P1.3) :** `lunr-index.bin` est **retiré de la publication**. Il était
déployé (~28 Mo sur Pages, via copie de `site/public/` par Vite) mais jamais
requêté par le front (qui reconstruit son index depuis `icons.json`).
`build:api` ne le copie plus (et supprime tout fichier résiduel) ; l'index ne
reste que dans le `dist/` **local** (`search-index.json`). Docs (README,
`CONTRIBUTING.md`, `site/README.md`), `check-data` et page Développeurs alignés.
Le chargement par shards reste à faire (chantier séparé).

**Livré (2026-10-21) — chargement progressif par shards :** `build:api` publie
désormais `index.json` (manifeste) + `icons-by-source/{source}.json` et **retire**
`icons.json` de `site/public/` (résidus `icons.json`/`lunr-index.bin` nettoyés).
Le front charge le manifeste, planifie les shards par effectif croissant
(`planSourceOrder`) et les **fusionne progressivement** : la grille s'affiche dès
le 1ᵉʳ shard (`isLoading` passe à `false`), l'indicateur « chargement du reste du
catalogue » reste visible jusqu'à `isComplete`, et l'index Lunr n'est construit
**qu'une fois** tout chargé (worker démarré après complétion). Échec partiel :
les icônes déjà reçues restent affichées, avec réessai inline. Modules ajoutés :
`site/src/api/manifest.ts` (types + garde + ordre), `getManifest`/`getSourceShard`
dans `api/client.ts`. `check-data` exige `index.json` + shards non vides ;
`check-precache` interdit tout JSON précaché (dont shards). Page Développeurs et
docs (README, `site/README.md`, `CONTRIBUTING.md`) alignés. Restauration de focus
de la modale durcie (`data-focus-restore`) pour survivre à un re-rendu de la
grille en cours de chargement. Vérifs : **348 tests** unitaires front (50
fichiers), **33 E2E**, `pnpm run verify` OK (bundle **105,9 Ko** / budget 130 Ko),
`dist/` sans `icons.json`, avec `index.json` + shards.

### P1.4 — Déduplication inter-sources
Aucun doublon **par `id` / `download_url` / `preview_image`** dans les données
*(vérifié : 0)*, mais aucune détection de recouvrement *sémantique* entre
`yotopixels` et `yoto-official` (même visuel, URLs différentes).

- [x] Détecter les doublons inter-sources (hash perceptuel ou normalisation du
  titre+artiste) et fusionner/marquer.

**Livré (2026-10-21) :** module pur `scripts/lib/dedupe.js` (testé). La clé
« titre + artiste normalisés » ne détecte **rien** (artistes structurellement
différents selon la source : `Yoto`, `@pseudo`) ; on retient « titre + catégorie
normalisés » avec **au plus 1 candidat par source** (écarte les blocs ambigus,
ex. 70 `yotoicons` « dog »). Résultat sur le catalogue réel : **45 groupes /
45 icônes marquées**, canonique = source prioritaire (`yoto-official` >
`yotopixels` > `yotoicons`). `build-api` renseigne `metadata.duplicate_of` et
`summary.duplicates` ; badge « Doublon » sur `IconCard`.

### P1.5 — Poids du dépôt Git *(vérifié)*
`site/public/icons.json` (18,7 Mo) et `lunr-index.bin` (28,4 Mo) sont **trackés**
et recommittés à chaque mise à jour hebdomadaire → croissance forte et
irréversible de l'historique.

- [x] Décider : sortir ces artefacts du dépôt (les générer au déploiement),
  ou assumer avec un artefact de release / Git LFS.

**Livré (2026-10-21) :** `site/public/icons.json` et `site/public/lunr-index.bin`
retirés du suivi (`git rm --cached`) et ajoutés au `.gitignore` ; régénérés par
`pnpm run build:api` (racine) avant chaque build. `summary.json` reste versionné
(marqueur de version pour P1.7). CI (`quality`) et `deploy-pages` génèrent les
données avant le build ; `update-icons` ne committe plus que `data/` +
`site/public/`. Garde-fou `site/scripts/check-data.mjs` (échec explicite si les
données manquent). L'historique passé n'est pas réduit (réécriture à éviter).

### P1.6 — Artefacts publiés parasites *(vérifié)*
- `site/public/manifest.json` (statique) est copié dans `dist/` avec un
  `start_url: "/"` **faux**, alors que le manifeste réellement référencé est
  `dist/manifest.webmanifest` (généré par `vite-plugin-pwa`). Deux manifestes
  contradictoires publiés.
- `index.html` enregistre **en dur** le service worker sur `/sw.js` (base
  erronée, 404 sur GitHub Pages) — doublon du `registerSW.js` injecté par
  VitePWA (l. 23-29).
- `test-index.html` est généré et **publié en production**.

- [x] Supprimer `site/public/manifest.json` (source unique = config VitePWA).
- [x] Retirer le script SW codé en dur de `site/index.html`.
- [x] Ne pas publier `test-index.html` (le garder dans `dist/` local seulement).

**Livré (2026-10-21) :** `manifest.json` supprimé (`git rm --cached`) ; script
`/sw.js` retiré de `index.html` (seul `registerSW.js` de VitePWA subsiste) ;
`build-api.js` n'écrit plus `test-index.html` dans `site/public`. Vérifié :
`site/dist` ne contient que `manifest.webmanifest`.

### P1.7 — `catalogVersion` non monotone
`build-api.js` (l. 226) génère toujours `YYYY.MM.DD-1` : deux builds le même jour
produisent la même version.

- [x] Rendre la version strictement croissante (compteur ou horodatage).

**Livré (2026-10-21) :** `scripts/lib/catalog-version.js`
(`formatCatalogVersion`, `nextCatalogVersion`, testé) ; `build-api.js` lit la
version publiée précédente (`readPreviousSummary`) et incrémente le compteur du
jour. Vérifié : `2026.10.21-1` → `-2` → `-3`.

---

## P2 — Qualité & contributivité

### P2.1 — Seuils de couverture trop bas *(vérifié)*
`vite.config.ts` (l. 145-148) fixe le plancher global à **24 % statements /
24 % lines**, alors que le code est déjà à **75 %**. Ajouter du code non testé ne
déclenche donc aucune alerte.

- [x] Remonter le plancher près du réel (ex. 70 %) et verrouiller les modules
  critiques restants (`hooks/useFilteredIcons`, `components/Filters`,
  `context/*`).

**Livré (2026-10-21) :** plancher global porté à **90 % st. / 85 % br. /
85 % fn. / 90 % lignes** (réel : 97,6 / 93,2 / 94,4 / 97,6). Les fichiers sans
code exécutable (barrels `index.ts`, `*.d.ts`) sont exclus de la couverture.
Verrous par module ajoutés : `useFilteredIcons`, `useKeyboardShortcuts`,
`Filters`, `Header`, `FavoriteButton`, `YotoMiniPreview`, `FavoritesContext`,
`IconsDataContext`, `pages/**`, `workers/**` (en plus des verrous existants
`api/constants/searchIndex/guards/utils/searchEngine/usePagination/useUrlSync`).

### P2.2 — Fichiers sans test unitaire *(vérifié)*
Aucun `.test.ts(x)` associé pour : `Header`, `Footer`, `LanguageSwitcher`,
`YotoMiniPreview`, `BackgroundColorSelector`, `FavoritesPage`,
`CategoriesListPage`, `AuthorsListPage`, `CategoryIconsPage`,
`useKeyboardShortcuts`, `workers/searchIndex.worker.ts`, et les `index.ts`
(barrels). Couverture actuelle : `Footer` 9 %, `Header` 11 %, `LanguageSwitcher`
10 %, `YotoMiniPreview` 48 %, `hooks/useKeyboardShortcuts` 35 %, pages 0 %.

- [x] Ajouter les tests manquants (en priorité `useKeyboardShortcuts`, pages,
  `Header`/`Footer`).

**Livré (2026-10-21) :** **275 tests** unitaires (42 fichiers), soit **+90**
depuis le début du lot P2. Nouveaux fichiers : `workers/searchIndex.worker`
(8, exerce le vrai worker via un `self` factice), `hooks/useKeyboardShortcuts`
(9), `pages/{CategoriesListPage (7), AuthorsListPage (7), CategoryIconsPage (6),
FavoritesPage (4)}`, `components/{Header (5), FavoriteButton (6),
LanguageSwitcher (2), YotoMiniPreview (2), BackgroundColorSelector (6)}`,
`context/FavoritesContext` (8). Au passage : le script racine `pnpm test`
(`node --test "scripts/lib/*.test.js"`) ne s'étendait pas sous Node 20 → aucun
test n'était lancé par le job CI `scripts-syntax` ; corrigé en
`node --test scripts/lib/`.

### P2.3 — Validation de schéma des données produites
Aucune validation JSON Schema des sorties de `build-api.js` (champs requis,
types, valeurs de `category`/`subcategory` ∈ taxonomie, `id` unique).

- [x] Ajouter un schéma + validation, exécutée par `build:api` **et** en CI.

**Livré (2026-10-21) :** validateur **pur et zéro-dépendance**
`scripts/lib/catalogue-schema.js` (25 tests) : champs requis et types des icônes,
`source`/`category`/`subcategory`/`license` ∈ énumérations (et licence
**cohérente** avec la source), `tags`/`downloads`/dates/URLs, **`id` uniques**,
cohérence du `summary` (`counts.bySource` couvre les 3 sources et somme au
`total`, bloc `duplicates`), manifeste (shards + SHA-256). Câblé dans
`build-api.js` avant chaque écriture (`failValidation` → `exit 1`). En CI,
`build:api` s'exécute déjà (P1.5) → validation de fait. **Il a détecté une
donnée hors taxonomie** : 8 entrées `yotopixels` portaient
`subcategory: "étoile"` (accentué, absent de `SUBCATEGORIES`) → corrigées en
`"etoile"` (`bySubcategory.etoile` = 250).

### P2.4 — Fixtures pour les scrapers restants
Seul `yotoicons` a des fixtures hors-ligne (`scripts/lib/yotoicons.test.js`).

- [x] Ajouter des fixtures HTML/JS pour `yotopixels` et `yoto-official`.

**Livré (2026-10-21) :** `yoto-official` était déjà couvert
(`yoto-official.test.js`, P0.3). Pour `yotopixels`, la logique pure (parsing du
script SvelteKit, repli cartes `article`, mapping au schéma commun) est extraite
dans `scripts/lib/yotopixels.js` (**13 tests** hors-ligne) ; le scraper ne garde
que le réseau et l'orchestration. La fixture reproduit la forme réelle :
`__sveltekit_<hash>` + `kit.start(app, element, { … data:{icons:[…]} …, form:… })`
(clés non citées, `:` dans les valeurs). Vérifié sur la page réelle : 24 icônes.

### P2.5 — Fichiers projet manquants *(vérifié : tous absents)*
`LICENSE` (annoncé MIT dans le README), `CONTRIBUTING.md`, `SECURITY.md`,
`CODE_OF_CONDUCT.md`, `.github/dependabot.yml`, `.github/ISSUE_TEMPLATE/`,
`.github/PULL_REQUEST_TEMPLATE.md`, `.nvmrc`/`.node-version`, `.editorconfig`.

- [x] Créer ces fichiers (au minimum `LICENSE` + `CONTRIBUTING.md` +
  Dependabot ; actuellement la CI est le seul garde-fou).

**Livré (2026-10-21) :** `LICENSE` (MIT), `CONTRIBUTING.md`, `SECURITY.md`,
`CODE_OF_CONDUCT.md`, `.nvmrc` (Node 20), `.editorconfig`,
`.github/dependabot.yml`, `.github/ISSUE_TEMPLATE/{bug_report,feature_request,config}.yml`,
`.github/PULL_REQUEST_TEMPLATE.md` (YAML validés).

### P2.6 — CI : cohérence données ↔ artefacts
La CI n'exécute pas `build:api` ni ne vérifie que `site/public/` est à jour par
rapport à `data/`.

- [x] Ajouter un job qui régénère et vérifie l'absence de diff (détecte les
  artefacts oubliés).

**Livré (2026-10-21) :** la prémisse « vérifier un no-diff » est **obsolète
depuis P1.5** : `icons.json`/`lunr-index.bin` ne sont plus suivis, et
`catalogVersion`/`updatedAt` changent à chaque build (un no-diff échouerait
toujours). Le risque restant — `data/` modifié sans régénérer le `summary.json`
**versionné** — est couvert par `scripts/lib/summary-sync.js` (pur, testé) +
CLI `scripts/check-summary-sync.js` : ils comparent les **compteurs**
(`total`, `counts.*`, `duplicates`) en ignorant version/date. Branchés dans
`ci.yml` (job `quality`) et `deploy-pages.yml`, juste après `build:api`
(snapshot du résumé versionné avant, comparaison après).

---

## P3 — Confort UX

### P3.1 — Dark mode *(vérifié : absent)*
Aucune règle `prefers-color-scheme` ni bascule dans `styles.css`/UI.

- [x] Ajouter un thème sombre (variables CSS + `prefers-color-scheme` +
  préférence persistée).
  *Hook `useTheme` (`light`/`dark`/`system`, persisté sous `yoto-icons-theme`),
  `ThemeSwitcher` dans l'en-tête, variables `[data-theme='dark']`, script
  d'amorçage anti-FOUC dans `index.html`. Tests : `useTheme` (11),
  `ThemeSwitcher` (2).*

### P3.2 — Export ZIP des favoris
- [x] Permettre de télécharger les icônes favorites en archive.
  *Writer ZIP maison (méthode *store*, zéro dépendance, `utils/zip.ts`) +
  `utils/exportFavorites.ts` (images + `favorites.json` + `README.txt`, une
  image inaccessible étant ignorée sans bloquer l'archive) ; bouton dans
  `FavoritesPage`. Tests : `zip` (8), `exportFavorites` (12), `FavoritesPage`
  (7).*

### P3.3 — SEO / partage *(vérifié : absent)*
Aucun `robots.txt`, `sitemap.xml`, ni balises Open Graph/Twitter ; la
`description` de l'HTML omet une source.

- [x] Ajouter métadonnées de partage, `robots.txt`, `sitemap.xml`.
  *OG/Twitter + `canonical` dans `index.html` (description alignée sur les 3
  sources), `public/robots.txt`, `public/sitemap.xml`, garde-fou `check:seo`
  branché dans `verify` et la CI.*

### P3.4 — Accessibilité restante *(vérifié, partiel)*
- La modale déclare `role="dialog" aria-modal="true"` mais **aucun déplacement ni
  piège de focus** n'est détecté (`IconDetailModal.tsx`) : la tabulation peut
  sortir de la modale.
- Aucun « lien d'évitement » (*skip to content*) dans le layout.

- [x] Déplacer le focus dans la modale à l'ouverture, le piéger, le restaurer à
  la fermeture.
  *Hook `useFocusTrap` (boucle Tab/Shift+Tab + restauration du focus) intégré à
  `IconDetailModal`. Tests : `useFocusTrap` (7), `IconDetailModal` (4).*
- [x] Ajouter un lien d'évitement vers `<main>`.
  *`.skip-link` → `<main id="main-content" tabindex="-1">` dans `App.tsx`.*

### P3.5 — Surlignage des termes recherchés
- [x] Mettre en évidence le terme recherché dans les cartes/résultats.
  *`utils/highlight.ts` + composant `HighlightedText` (`<mark>`), prop
  `highlight` propagée d'`IconsBrowser` → `IconsGrid` → `IconCard`. Tests :
  `highlight` (8), `HighlightedText` (4), `IconCard` (7).*

---

## Historique (déjà fait — conservé pour mémoire)

### Lot P0 livré (2026-10-21)

- **P0.1** Repli SPA GitHub Pages : `postbuild.mjs` (`dist/404.html`), contrôle
  `check:spa`, étape CI, serveur E2E type GitHub Pages + spec `spa-fallback`.
- **P0.2** Erreurs non silencieuses : `error`/`reload` dans `IconsDataContext`,
  `ErrorState`, `ErrorBoundary` racine.
- **P0.3** Scraper yoto-official : découverte dynamique du bundle
  (`lib/yoto-official.js`, testé).
- **P0.4** `build:api` : échec sur source manquante/vide + anti-régression
  (`lib/catalogue-guards.js`, testé).
- **P0.5** Docs alignées (compteurs, endpoints publiés, 3 sources).
- **P0.6** Licences en source unique (`lib/source-licenses.js`) ; yotopixels
  normalisé `CC-BY-SA` (aucune licence publiée par le site).

### Lot P1 livré (2026-10-21)

- **P1.1** Tri « Date » retiré (`date_added` = date de collecte pour 95 % du
  catalogue) ; libellé du détail « Collectée le ».
- **P1.2** Filtres par source et par licence (UI + URL + état), et correction du
  retard de synchronisation d'URL (`useUrlSync` lit via ref).
- **P1.3** Données plus précachées par le SW (cache runtime `catalogue-data`),
  garde-fou `check:precache` ; précache 18 777 Ko → 449 Ko. Chargement
  **progressif par shards** : `index.json` + `icons-by-source/{source}.json`
  publiés, `icons.json` retiré de la publication, fusion côté front et index Lunr
  construit une seule fois (`site/src/api/manifest.ts`).
- **P1.4** Doublons inter-sources détectés et marqués (`lib/dedupe.js`,
  `summary.duplicates`, badge « Doublon ») : 45 groupes / 45 icônes.
- **P1.5** `site/public/icons.json` (désormais non publié) et `lunr-index.bin`
  sortis du dépôt (régénérés par `build:api`), CI/déploiement adaptés,
  garde-fou `check:data`.
- **P1.6** Artefacts publiés parasites : `site/public/manifest.json` supprimé,
  enregistrement SW en dur retiré, `test-index.html` non publié.
- **P1.7** `catalogVersion` strictement croissante (`lib/catalog-version.js`).

### Labels précédents (P0.1 → P3.1 d'origine)

- **P0.1** Enrichissement yotoicons : `populate_icon_modal` exploité
  (`scripts/lib/yotoicons.js` + tests) → `objets/autre` passé de 98 % à 26 %.
- **P0.2** Repli `inferTags(title)` pour yotopixels sans tags.
- **P0.3** `DEFAULT_SORT` centralisé dans `site/src/utils/urlParams.ts`.
- **P1.1** `lunr-index.bin` : champs de l'index serveur alignés sur le client.
- **P1.3** Ancien `site/lunr-index.bin` (10,6 Mo) supprimé.
- **P2.5/documentation** README aligné sur React Router v7 ; `@types/react-router-dom` retiré.
- **P3.1** Traduction catégorie/sous-catégorie + locale i18n dynamique.
- Extraction de `IconsBrowser` / `useIconsBrowser` (fin de la triplication).
- Web Worker pour l'index Lunr + contexte de données unique.

---

## Ordre d'exécution proposé

1. **P0.1 → P0.4** (correctness : 404 SPA, erreurs silencieuses, scrapers/build
   fragiles) — ce sont les seuls défauts qui cassent l'expérience ou peuvent
   corrompre les données publiées.
2. **P0.5, P0.6, P1.6, P1.7** (dérive docs, licence, artefacts parasites,
   versionnage) — corrections rapides et à fort effet.
3. **P1.1, P1.2** (dates, filtres source/licence).
4. **P1.3, P1.5** (poids du 1er chargement, poids du dépôt) — décisions
   d'architecture à trancher.
5. **P1.4** (dédup), puis **P2.1 → P2.6** — **lot P2 livré**.
6. **P3** (UX) — **lot P3 livré**.

## Vérification

- Front : `cd site && pnpm run verify`
  (lint + `tsc` + i18n + tests + build + budget bundle + repli SPA + précache +
  SEO). **OK** ; couverture **97,9 / 93,6 / 95,4 / 97,9** ≥ seuils
  **90 / 85 / 85 / 90**.
- Scrapers/data : `pnpm test` (racine, **125 verts**) puis `pnpm run build:api` doit
  **passer et échouer proprement** en cas de source manquante. **Vérifié.**
- Cohérence données ↔ résumé : `node scripts/check-summary-sync.js` après un
  snapshot du `summary.json` versionné (branché en CI et au déploiement). **Vérifié.**
- E2E : `cd site && pnpm run test:e2e` (prérequis
  `pnpm exec playwright install chromium`), **33 verts** dont 3 sur la route
  profonde directe (P0.1), 2 sur les filtres source/licence (P1.2) et 5 sur le
  lot P3 (thème, surlignage, piège de focus, lien d'évitement, export ZIP).
- Front unitaires : **334 verts** (49 fichiers).
- Data : rejouer les comptages (totaux, `objets/autre`, dates distinctes,
  licences) avant/après toute régénération.

### Lot P2 livré (2026-10-21)

- **P2.1** Seuils de couverture relevés (90 / 85 / 85 / 90) + verrous par module ;
  barrels/`*.d.ts` exclus de la mesure.
- **P2.2** +90 tests unitaires (275 au total) ; script racine `pnpm test` corrigé
  (le glob cité ne s'étendait pas sous Node 20 → CI `scripts-syntax` ne lançait
  rien).
- **P2.3** Validateur de schéma pur (`lib/catalogue-schema.js`) câblé dans
  `build:api` ; bug de taxonomie détecté (8 `étoile` → `etoile`).
- **P2.4** Logique yotopixels extraite et testée hors-ligne
  (`lib/yotopixels.js`, fixtures SvelteKit réelles).
- **P2.5** Fichiers projet créés (LICENSE MIT, CONTRIBUTING, SECURITY,
  CODE_OF_CONDUCT, Dependabot, templates d'issues/PR, `.nvmrc`, `.editorconfig`).
- **P2.6** Garde-fou de cohérence `data/` ↔ `summary.json`
  (`lib/summary-sync.js` + CLI), branché en CI/déploiement.

### Lot P3 livré (2026-10-21)

- **P3.1** Thème clair/sombre : hook `useTheme` (`light`/`dark`/`system`,
  persisté), `ThemeSwitcher` dans l'en-tête, variables CSS
  `[data-theme='dark']`, script d'amorçage anti-FOUC dans `index.html`.
- **P3.2** Export ZIP des favoris : writer ZIP « store » maison (`utils/zip.ts`,
  CRC-32, zéro dépendance), `utils/exportFavorites.ts` (images + manifeste
  `favorites.json` + `README.txt`, échec d'image non bloquant, URL vide
  ignorée), bouton dans `FavoritesPage`.
- **P3.3** SEO/partage : Open Graph + Twitter Card + `canonical` dans
  `index.html`, `public/robots.txt`, `public/sitemap.xml`, garde-fou
  `check:seo` (câblé dans `verify` et la CI).
- **P3.4** Accessibilité : hook `useFocusTrap` (déplacement/piège/restauration
  du focus) intégré à `IconDetailModal`, lien d'évitement `.skip-link` vers
  `<main id="main-content">`.
- **P3.5** Surlignage : `utils/highlight.ts` (découpage multi-termes, sûr vis-à-
  vis des caractères spéciaux) + composant `HighlightedText` (`<mark>`), prop
  `highlight` propagée jusqu'aux cartes.
- Nouvelles clés i18n fr/en (`a11y.*`, `theme.*`, `favorites.export*`) →
  **247 clés** alignées ; **334** tests front, **33** E2E, couverture
  **97,9 / 93,6 / 95,4 / 97,9**, bundle **105,1 Ko** (budget 130 Ko).
