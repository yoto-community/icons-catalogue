# Yoto Icons Catalogue — Search Frontend

Application React (Vite + TypeScript) pour la recherche unifiée d'icônes 16×16 Yoto Player.

## Fonctionnalités

- **Recherche unifiée** : yotopixels + yotoicons sans filtre de source
- **Recherche full-text** via Lunr.js (tags boostés ×10)
- **Filtres** : Catégorie, Sous-catégorie
- **Tri** : Téléchargements (défaut), Titre A-Z, Date
- **Pagination** (48 icônes/page)
- **Raccourcis clavier** :
  - `/` → Focus recherche
  - `Échap` → Effacer recherche
- **Synchronisation URL** : partage de liens avec filtres
- **Responsive** : mobile-first, grille adaptative
- **Accessibilité** : ARIA, focus visible, navigation clavier

## Installation

```bash
cd unified-search
npm install
```

## Développement

```bash
npm run dev
# http://localhost:5173/icons-catalogue/
```

## Build production

```bash
npm run build
# Sortie dans dist/
```

## Structure

```
unified-search/
├── public/
│   ├── combined-icons.json      # Données icônes (copié au build)
│   ├── summary-combined.json    # Stats globales (copié au build)
│   └── favicon.svg
├── src/
│   ├── main.tsx                 # Point d'entrée
│   ├── App.tsx                  # Composant principal
│   └── styles.css               # Styles CSS (pas de framework CSS)
├── dist/                        # Build production (GitHub Pages)
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Déploiement GitHub Pages

1. Le dossier `dist/` contient l'application statique
2. Configurer GitHub Pages sur le dossier `dist/` ou branche `gh-pages`
3. L'URL de base est `/icons-catalogue/` (configuré dans `vite.config.ts`)

### Via GitHub Actions (recommandé)

Ajouter un workflow `.github/workflows/deploy.yml` à la racine du repo :

```yaml
name: Deploy Icons Catalogue

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: unified-search/package-lock.json

      - name: Install & Build
        working-directory: ./unified-search
        run: |
          npm ci
          npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./unified-search/dist
```

## API de données

L'application charge deux fichiers JSON au démarrage :

1. `combined-icons.json` — Tableau d'icônes normalisées
2. `summary-combined.json` — Statistiques globales

Format d'une icône :
```json
{
  "id": "yi-artist-titre-icone",
  "source": "yotoicons",
  "tags": ["moon", "night"],
  "artist": "nom-artiste",
  "title": "Titre de l'icône",
  "preview_image": "https://.../preview-16x16.png",
  "download_url": "https://.../icon-16x16.png",
  "category": "nature",
  "subcategory": "croissant",
  "downloads": 123,
  "date_added": "2026-10-18T10:30:00Z"
}
```

## Personnalisation

### Couleurs (CSS variables)
```css
:root {
  --color-primary: #e94560;        /* Couleur principale */
  --color-primary-dark: #c0392b;   /* Survol */
  --color-background: #f8f9fa;     /* Fond */
  --color-surface: #ffffff;        /* Cartes */
  /* ... */
}
```

### Nombre d'icônes par page
Modifier `ICONS_PER_PAGE` dans `App.tsx` (défaut: 48)

### Délai debounce recherche
Modifier `DEBOUNCE_MS` dans `App.tsx` (défaut: 80ms)

## Dépendances principales

- **React 18** + **React DOM 18**
- **Lunr.js 2.3.9** — Recherche full-text côté client
- **Vite 5** — Build tool
- **TypeScript 5** — Typage statique

Pas de framework CSS — Styles CSS natifs avec variables personnalisées.