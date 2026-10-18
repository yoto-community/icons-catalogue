# Yoto Icons Catalogue

Catalogue unifié d'icônes 16×16 pour Yoto Player — indexation cross-source (yotopixels + yotoicons + yoto-official) avec recherche full-text.

## Structure

```
icons-catalogue/
├── data/
│   ├── yotopixels-icons.json       # Données brutes yotopixels (~1 300 icônes)
│   ├── yotoicons-icons.json        # Données brutes yotoicons (~25 500 icônes)
│   ├── yoto-official-icons.json    # Données brutes icônes officielles Yoto (~500 icônes)
│   ├── combined-icons.json         # Fusion simplifiée pour le front (copie)
│   └── summary-combined.json       # Statistiques globales (copie)
├── scripts/
│   ├── yotopixels-scraper.js       # Scraper yotopixels.com (API SvelteKit)
│   ├── yotoicons-scraper.js        # Scraper yotoicons.com (pagination complète)
│   ├── yoto-official-scraper.js    # Scraper icônes officielles Yoto (bundle JS)
│   └── build-combined.js           # Build index Lunr + fusion des 3 sources
├── unified-search/                 # Frontend React (Vite + TypeScript + PWA)
│   ├── src/
│   │   ├── components/             # Composants UI (Grid, Filters, Modal, etc.)
│   │   ├── hooks/                  # Hooks personnalisés (useIconsData, useFilteredIcons, etc.)
│   │   ├── pages/                  # Pages (Catalogue, Favorites, Categories, Authors)
│   │   ├── types/                  # Types TypeScript
│   │   ├── utils/                  # Utilitaires
│   │   └── constants/              # Constantes
│   ├── public/                     # Assets statiques (copiés au build)
│   ├── dist/                       # Build production (GitHub Pages)
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts              # Config Vite + PWA (Workbox)
│   └── README.md
└── .github/workflows/              # À créer pour automatisation
```

## Installation

```bash
# Racine (scrapers + build)
cd icons-catalogue
pnpm install

# Frontend
cd unified-search
pnpm install
```

## Utilisation (Scripts de scraping & build)

```bash
# Scraper yotopixels uniquement
pnpm run scrape:yotopixels

# Scraper yotoicons uniquement
pnpm run scrape:yotoicons

# Scraper icônes officielles Yoto
pnpm run scrape:yoto-official

# Build complet (3 scrapers + index Lunr)
pnpm run update:all

# Build de l'index uniquement (si données déjà présentes)
pnpm run build:index
```

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
  "category": "nature|animaux|objets|activités|émotions|formes|personnages|transport|nourriture|batiments|musique|fetes",
  "subcategory": "croissant|plein|cœur|étoile|autre|lune|soleil|animal|vehicule|batiment|nourriture|noel|halloween|anniversaire|musique",
  "downloads": 123,
  "date_added": "2026-10-18T10:30:00Z",
  "license": "CC-BY-SC" | "CC-BY-NC" | "Yoto Official",
  "metadata": {
    "pack": "nom-du-pack",
    "color_palette": ["#hex1", "#hex2"],
    "dominant_colors": ["#hex1"],
    "original_id": "...",
    "creator_id": "...",
    "media_id": "...",
    "official": true
  }
}
```

## Sources de données

| Source | Icônes | Licence | Méthode |
|--------|--------|---------|---------|
| **yotopixels** | ~1 300 | CC-BY-SC | API SvelteKit (`/search?q=&sort=newest&page=N`) |
| **yotoicons** | ~25 500 | CC-BY-NC | Pagination HTML (`/icons?page=N`) |
| **yoto-official** | ~520 | Yoto Official | Bundle JS Astro (`/_astro/Icons.*.js`) |

**Total : ~27 400 icônes unifiées**

## Frontend (unified-search)

Application React 18 + TypeScript + Vite 5 avec PWA (Workbox).

### Fonctionnalités

- **Recherche unifiée** : 3 sources sans filtre de source
- **Recherche full-text** via Lunr.js (tags boostés ×10, artiste, titre, catégorie, sous-catégorie)
- **Filtres** : Catégorie, Sous-catégorie (dépendante de la catégorie)
- **Tri** : Téléchargements (défaut), Titre A-Z, Date
- **Pagination** (48 icônes/page)
- **Raccourcis clavier** : `/` → Focus recherche, `Échap` → Effacer
- **Synchronisation URL** : partage de liens avec filtres (`?q=moon&cat=nature&sort=downloads`)
- **Favoris** : Persistance localStorage, page dédiée `/favorites`
- **Pages catégories** : `/categories` (liste) → `/categories/:category` (icônes)
- **Pages auteurs** : `/authors` (liste) → `/authors/:artist` (icônes)
- **Modal détail** : Aperçu grand format, téléchargement, métadonnées
- **Mini-preview** : Survol latéral au clic droit / icône 🔍
- **Responsive** : mobile-first, grille adaptative (1-5 colonnes)
- **Accessibilité** : ARIA, focus visible, navigation clavier
- **PWA** : Installation, cache offline (Workbox, 15 Mo max pour combined-icons.json)

### Développement

```bash
cd unified-search
pnpm run dev
# http://localhost:5173/icons-catalogue/
```

### Build production

```bash
cd unified-search
pnpm run build
# Sortie dans dist/
```

### Structure du frontend

```
unified-search/
├── public/
│   ├── combined-icons.json      # Données icônes (copié au build depuis ../data)
│   ├── summary-combined.json    # Stats globales (copié au build depuis ../data)
│   └── favicon.svg
├── src/
│   ├── main.tsx                 # Point d'entrée + React Router
│   ├── App.tsx                  # Composant principal + routes
│   └── styles.css               # Styles CSS natifs (variables CSS)
├── dist/                        # Build production (GitHub Pages)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts               # base: '/icons-catalogue/', PWA config
└── README.md
```

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

### Option 1 : Workflow unique (recommandé)

Créer `.github/workflows/update-and-deploy.yml` à la racine :

```yaml
name: Update Icons & Deploy

on:
  schedule:
    - cron: '0 4 * * 1'  # Tous les lundis 4h UTC
  workflow_dispatch:

permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  update-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install deps (root)
        run: pnpm install

      - name: Run scrapers & build index
        run: pnpm run update:all

      - name: Install deps (unified-search)
        working-directory: ./unified-search
        run: pnpm install

      - name: Build frontend
        working-directory: ./unified-search
        run: pnpm run build

      - name: Commit data changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data/ unified-search/public/
          git diff --staged --quiet || git commit -m "chore: update icons data [skip ci]"

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./unified-search/dist
          force_orphan: true
```

Puis activer GitHub Pages sur la branche `gh-pages` (créée par le workflow).

### Option 2 : Workflows séparés

1. **`.github/workflows/update-icons.yml`** : Scraping hebdomadaire (commit data)
2. **`.github/workflows/deploy.yml`** : Build + deploy frontend (sur push `main`)

URL finale : `https://username.github.io/icons-catalogue/unified-search/` → redirigé vers `https://username.github.io/icons-catalogue/` par le PWA scope.

## Fonctionnalités de recherche (détail technique)

- **Moteur** : Lunr.js 2.3.9 (côté client, index sérialisé en `lunr-index.bin`)
- **Champs indexés** : `tags` (boost 10), `artist`, `title`, `category`, `subcategory`
- **Index rebuilt à chaque `build:index`** côté serveur (Node) + rebuild côté client au chargement
- **Pas de backend requis** — 100% statique (fichiers JSON + index binaire)

## Notes techniques

- Les scrapers utilisent les sélecteurs CSS / patterns actuels des sites
- Si la structure HTML/JS change, mettre à jour les sélecteurs dans `scripts/*.js`
- L'index Lunr est sérialisé en JSON pour chargement côté client (`lunr-index.bin`)
- Le frontend rebuild aussi l'index côté client au démarrage (pour flexibilité)
- PWA Workbox cache `combined-icons.json` (jusqu'à 15 Mo) + assets statiques
- Icônes officielles Yoto : pas de compteur de téléchargements (fixé à 0)

## Données actuelles (dernier build)

- **Total** : 27 399 icônes
- **yotopixels** : 1 314
- **yotoicons** : 25 566
- **yoto-official** : 519

### Catégories principales
- `objets` : 26 893 (majorité yotoicons)
- `animaux` : 222
- `nature` : 84
- `personnages` : 50 (yoto-official)
- `transport` : 42
- `musique` : 21
- `nourriture` : 20
- `émotions` : 17
- `batiments` : 25
- `fetes` : 15
- `activites` : 9
- `formes` : 1

## Licence

MIT — Les icônes restent la propriété de leurs auteurs respectifs (yotopixels, yotoicons, Yoto).