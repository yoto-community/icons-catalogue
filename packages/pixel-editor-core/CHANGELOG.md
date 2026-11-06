# @yoto-community/pixel-editor-core

## 0.1.1

### Patch Changes

- Corrige l'empaquetage ESM du paquet publié : les imports et ré-exports relatifs
  de `dist/` portent désormais explicitement l'extension `.js`, et la compilation
  utilise `module`/`moduleResolution: "NodeNext"`.
  Sans cette correction, Node refusait de résoudre `dist/index.js` (import
  `from './constants'`), ce qui cassait le build SSR et les tests des projets
  consommateurs dès qu'ils importaient le paquet.

## 0.1.0

### Minor Changes

- 9497e52: Extract the pure 16x16 pixel editor core.
