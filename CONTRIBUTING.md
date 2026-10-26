# Contributing

Merci de contribuer au **Yoto Icons Catalogue** ! Ce document décrit
l'environnement, les conventions et les vérifications attendues avant une PR.

## Prérequis

- **Node.js 22** (voir `.nvmrc` : `nvm use`)
- **pnpm 12** (via `packageManager` dans `package.json` : `corepack enable`)
- **Chromium** pour les tests E2E : `pnpm exec playwright install chromium`

## Installation

Le dépôt contient **deux paquets** : la racine (scrapers + build API) et
`site/` (frontend React).

```bash
# Racine
pnpm install

# Données du catalogue (générées, non versionnées — obligatoire avant le build du site)
pnpm run build:api

# Frontend
cd site && pnpm install
```

## Structure

- `scripts/` — scrapers et `build-api.js` (racine, Node pur).
  La logique pure vit dans `scripts/lib/` et est testée avec `node:test`.
- `data/` — données **brutes** scrapées (source de vérité, versionnées).
- `site/` — frontend Vite + React + TypeScript. Voir `site/README.md`.

> `site/public/index.json` et `site/public/icons-by-source/` sont **générés** par
> `pnpm run build:api` et ne sont **pas** versionnés ; `site/public/summary.json`
> est également généré mais **reste versionné** (marqueur de `catalogVersion`).

## Développement

```bash
cd site && pnpm run dev   # http://localhost:5173/icons-catalogue/
```

## Tests (TDD attendu)

Toute logique nouvelle ou corrigée s'accompagne d'un test **écrit d'abord**.

```bash
# Modules partagés racine (node:test)
pnpm test

# Frontend (Vitest)
cd site && pnpm run test:watch      # en continu
cd site && pnpm run test:coverage   # + seuils de couverture
cd site && pnpm run test:e2e        # parcours Playwright + audit a11y
```

## Vérifications avant PR

Tout doit passer :

```bash
# Racine
pnpm test
pnpm run build:api

# Frontend
cd site
pnpm run lint
pnpm run format:check
pnpm run verify   # lint + tsc + i18n + tests + build + budget bundle + SPA + précache + SEO
pnpm run test:e2e
```

Ces mêmes commandes tournent en CI (`.github/workflows/ci.yml`) sur chaque PR.

## Conventions

- **Commits** : [Conventional Commits](https://www.conventionalcommits.org/)
  (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `perf:`, `ci:`).
  Messages en français ou en anglais, à l'impératif.
- **TypeScript** : `strict` activé, `import type` pour les types (ESLint le
  vérifie). Ordre : `eslint --fix` **puis** `prettier --write`.
- **i18n** : toute chaîne visible passe par `t()` ; fr et en doivent rester
  alignés (`pnpm run check:i18n`).
- **Taxonomie** : catégories et sous-catégories proviennent de
  `scripts/lib/taxonomy.js` (source unique, testée).
- **Licences** : attribuées par `scripts/lib/source-licenses.js` (source unique).

## Signaler un problème

- **Bug / fonctionnalité** : ouvrez une *issue* (modèles fournis dans
  `.github/ISSUE_TEMPLATE/`).
- **Faille de sécurité** : **ne pas** ouvrir d'issue publique — voir
  [SECURITY.md](SECURITY.md).

## Licence

En contribuant, vous acceptez que votre code soit publié sous licence **MIT**
(voir [LICENSE](LICENSE)). Les icônes restent la propriété de leurs auteurs.
