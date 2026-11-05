# @yoto-community/pixel-editor-react

Composant React accessible de l'éditeur d'icônes 16×16 du
[Yoto Icons Catalogue](https://github.com/yoto-community/icons-catalogue).

Il s'appuie sur [`@yoto-community/pixel-editor-core`](https://www.npmjs.com/package/@yoto-community/pixel-editor-core)
pour le modèle de grille, l'historique, l'import d'images et l'encodage PNG.
Le composant est autonome vis-à-vis de l'hôte : la langue vient de `messages`
ou de `t`, la clé de brouillon est injectable, et aucune feuille de style
globale n'est requise en dehors de `styles.css`.

## Installation

```bash
pnpm add @yoto-community/pixel-editor-react react react-dom
```

`react` et `react-dom` (19.x) sont des dépendances pairs.

## Usage

```tsx
import { PixelEditor, fr } from '@yoto-community/pixel-editor-react';
import '@yoto-community/pixel-editor-react/styles.css';

export function Page() {
  return <PixelEditor messages={fr} onChange={(grid) => console.log(grid)} />;
}
```

Sans racine React (page statique, widget) :

```ts
import { mountPixelEditor } from '@yoto-community/pixel-editor-react';
import '@yoto-community/pixel-editor-react/styles.css';

const unmount = mountPixelEditor(document.querySelector('#editor')!, { compact: true });
// … plus tard
unmount();
```

## API

La racine du paquet expose exactement :

- `PixelEditor` — composeur complet : barre d'outils, palette, grille, aperçu,
  historique, import d'image, export PNG et brouillon auto-sauvegardé.
- `PixelEditorProps` — type des props du composant.
- `mountPixelEditor(element, props?)` — monte `PixelEditor` dans un élément DOM
  et renvoie la fonction de démontage.
- `en`, `fr` — dictionnaires de messages fournis.
- `createTranslator`, `defaultTranslate` — traduction minimale, sans dépendance
  à un système i18n externe.
- `EditorMessagesProvider`, `useEditorT` — injection d'un traducteur aux
  sous-composants.
- `Translate`, `EditorMessages` — types de la traduction et des dictionnaires.

Les briques d'interface (grille, barre d'outils, palette, aperçu, historique,
import, statut) et les hooks internes du composeur ne font pas partie de l'API
publique : ils ne sont pas exportés par la racine du paquet. Pour une interface
sur mesure, composez autour de `PixelEditor` (props `compact`, `showActions`,
`onChange`, `onExport`) plutôt qu'en réutilisant ses sous-composants.

### Props de `PixelEditor`

| Prop              | Type                | Rôle                                              |
| ----------------- | ------------------- | ------------------------------------------------- |
| `initialGrid`     | `PixelGrid`         | Grille de départ (vide par défaut).               |
| `initialImageUrl` | `string`            | Image importée au montage.                        |
| `messages`        | `EditorMessages`    | Dictionnaire de messages (`en` / `fr` fournis).   |
| `t`               | `Translate`         | Traducteur de l'hôte, prioritaire sur `messages`. |
| `storageKey`      | `string`            | Clé `localStorage` du brouillon.                  |
| `compact`         | `boolean`           | Masque les actions globales.                      |
| `showActions`     | `boolean`           | Masque explicitement les actions globales.        |
| `onChange`        | `(grid) => void`    | Notifié à chaque modification de la grille.       |
| `onExport`        | `(dataUrl) => void` | Remplace le téléchargement intégré.               |

## Accessibilité

Grille navigable au clavier (flèches, `Home`/`End`), raccourcis outils et
couleurs, `Ctrl+Z` / `Ctrl+Shift+Z`, et annonces `aria-live` des actions.

## Développement

```bash
pnpm --filter @yoto-community/pixel-editor-react test
pnpm --filter @yoto-community/pixel-editor-react build
```

## Licence

MIT © Yoto Community — le texte complet accompagne le paquet
([`LICENSE`](https://github.com/yoto-community/icons-catalogue/blob/main/packages/pixel-editor-react/LICENSE)).
