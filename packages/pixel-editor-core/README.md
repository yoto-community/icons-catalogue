# @yoto-community/pixel-editor-core

Cœur pur et sans dépendance de l'éditeur d'icônes 16×16 du
[Yoto Icons Catalogue](https://github.com/yoto-community/icons-catalogue).

Le paquet contient le modèle de grille RGBA, l'historique et le réducteur de
l'éditeur, l'import d'images, l'encodage PNG, la persistance du brouillon et la
gestion du clavier. Il ne dépend d'aucun framework : il est utilisable tel quel
depuis React, Vue, Svelte ou du JavaScript vanilla.

## Installation

```bash
pnpm add @yoto-community/pixel-editor-core
```

Le paquet est publié en ESM uniquement et fournit ses déclarations TypeScript.

## Exemple minimal

```ts
import { createGrid, setPixel, encodePngDataUrl } from '@yoto-community/pixel-editor-core';

const grid = createGrid();
setPixel(grid, 0, 0, [255, 0, 0, 255]);

const dataUrl = encodePngDataUrl(grid);
// data:image/png;base64,… — directement utilisable dans <img src>.
```

## API publique

Import depuis la racine du paquet :

```ts
import { createEditorState, editorReducer } from '@yoto-community/pixel-editor-core';
```

### Grille et couleurs — `pixel-editor`

- `createGrid(fill?)` / `cloneGrid(grid)` — création et copie d'une grille
  `Uint8ClampedArray` de 16×16 pixels RGBA.
- `getPixel(grid, x, y)` / `setPixel(grid, x, y, color)` — lecture et écriture
  bornées (`null` / `false` hors limites).
- `floodFill(grid, x, y, color)` — remplissage 4 voies ; renvoie le nombre de
  pixels modifiés.
- `isEmpty(grid)`, `countColors(grid)`, `hasPureBlack(grid)` — diagnostics.
- `hexToRgba(hex)` / `rgbaToHex(color)` — conversions de couleur.
- `encodeGrid(grid)` / `decodeGrid(encoded)` — sérialisation compacte.
- `createEditorState(grid?, color?)` / `editorReducer(state, action)` — état et
  réducteur purs (outils `pencil`, `eraser`, `fill`, `picker`, historique
  limité, undo/redo).

### Import d'images — `image-import`

- `imageDataToGrid(imageData)` — convertit un `ImageData` (ou équivalent) en
  grille 16×16, ou `null` si les dimensions sont invalides.
- `fitAnalysisSize(width, height)` / `alphaBoxDownscale(...)` — utilitaires de
  réduction utilisés par l'import.

### Encodage PNG — `png`

- `encodePng(grid)` — `Uint8Array` PNG.
- `createPngBlob(grid)` — `Blob` `image/png` prêt à télécharger.
- `encodePngDataUrl(grid)` — data URL `data:image/png;base64,…`.

### Brouillon — `storage`

- `isDraftStorageAvailable()`, `saveDraft(grid, updatedAt?)`, `loadDraft()`,
  `clearDraft()` — persistance optionnelle dans `localStorage` (silencieusement
  inopérante si le stockage est indisponible).

### Clavier — `keyboard`

- `moveFocus(position, key)`, `isActivationKey(key)`,
  `toolForShortcut(key)`, `paletteIndexForShortcut(key)` — navigation et
  raccourcis de l'éditeur.

### Constantes — `constants`

`GRID_SIZE`, `PIXEL_COUNT`, `HISTORY_LIMIT`, `EDITOR_PALETTE`,
`EDITOR_EXPORT_FILENAME`, etc.

## Export `./browser`

Les API qui touchent au DOM sont isolées dans le sous-chemin `./browser`, afin
que la racine du paquet reste exécutable en Node (build, tests, SSR) :

```ts
import { decodeImageBlob, ImageDecodeError } from '@yoto-community/pixel-editor-core/browser';

const grid = await decodeImageBlob(file);
```

`decodeImageBlob(blob)` décode un fichier image (PNG, JPEG, WebP, GIF…) en
grille 16×16 et lève une `ImageDecodeError` en cas d'échec.

## Développement

```bash
pnpm --filter @yoto-community/pixel-editor-core test
pnpm --filter @yoto-community/pixel-editor-core build
```

## Licence

MIT © Yoto Community — le texte complet accompagne le paquet
([`LICENSE`](https://github.com/yoto-community/icons-catalogue/blob/main/packages/pixel-editor-core/LICENSE)).
