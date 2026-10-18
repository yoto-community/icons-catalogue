# Yoto Icons Catalogue

Catalogue unifié d'icônes 16×16 pour Yoto Player — indexation cross-source (yotopixels + yotoicons) avec recherche full-text.

## Structure

```
icons-catalogue/
├── data/
│   ├── yotopixels-icons.json      # Données brutes yotopixels
│   ├── yotoicons-icons.json       # Données brutes yotoicons
│   ├── combined-icons.json        # Fusion simplifiée pour le front
│   └── summary-combined.json      # Statistiques globales
├── scripts/
│   ├── yotopixels-scraper.js      # Scraper yotopixels.com
│   ├── yotoicons-scraper.js       # Scraper yotoicons.com
│   └── build-combined.js          # Build index Lunr + fusion
├── unified-search/
│   ├── index.html                 # Page de recherche GitHub Pages
│   ├── lunr-index.bin             # Index full-text sérialisé
│   ├── combined-icons.json        # Copie pour le front
│   └── summary-combined.json      # Stats pour affichage
└── .github/workflows/
    └── update-icons.yml           # Auto-update hebdomadaire
```

## Installation

```bash
cd icons-catalogue
pnpm install
```

## Utilisation

```bash
# Scraper yotopixels uniquement
pnpm run scrape:yotopixels

# Scraper yotoicons uniquement
pnpm run scrape:yotoicons

# Build complet (scrapers + index)
pnpm run update:all

# Build de l'index uniquement
pnpm run build:index
```

## Schéma de données commun

Chaque icône suit ce format normalisé :

```json
{
  "id": "yt-artist-titre-icone",
  "source": "yotopixels" | "yotoicons",
  "tags": ["moon", "night", "nature"],
  "artist": "nom-artiste",
  "title": "Titre de l'icône",
  "preview_image": "https://.../preview-16x16.png",
  "download_url": "https://.../icon-16x16.png",
  "category": "nature|animaux|objets|activités|émotions|formes",
  "subcategory": "croissant|plein|cœur|étoile|autre",
  "downloads": 123,
  "date_added": "2026-10-18T10:30:00Z",
  "license": "CC-BY-SC" | "CC-BY-NC",
  "metadata": {
    "pack": "nom-du-pack",
    "color_palette": ["#hex1", "#hex2"],
    "dominant_colors": ["#hex1"]
  }
}
```

## Déploiement GitHub Pages

1. Push sur `main` → GitHub Actions s'exécute automatiquement (tous les lundis 4h UTC)
2. Les fichiers de `unified-search/` sont commités
3. Activez GitHub Pages sur le dossier `unified-search/` ou branche `gh-pages`
4. URL : `https://username.github.io/icons-catalogue/unified-search/`

## Fonctionnalités de recherche

- **Recherche full-text** via Lunr.js (tags boostés x10)
- **Filtres** : source (yotopixels/yotoicons), catégorie
- **Tri** : téléchargements, titre, date
- **Pagination** (50 icônes/page)
- **Icône aléatoire** (bouton 🎲)
- **Responsive** mobile-first

## Notes techniques

- Les scrapers utilisent les sélecteurs CSS actuels des sites
- Si la structure HTML change, mettre à jour les sélecteurs dans `scripts/*.js`
- L'index Lunr est sérialisé en JSON pour chargement côté client
- Pas de backend requis — 100% statique

## Licence

MIT — Les icônes restent la propriété de leurs auteurs respectifs (yotopixels/yotoicons).