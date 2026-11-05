import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { PixelEditor, type PixelEditorProps } from './PixelEditor';

export * from './PixelEditor';
export * from './messages';
export { EditorMessagesProvider, useEditorT } from './EditorMessagesContext';

/**
 * Monte l'éditeur dans un élément DOM et renvoie la fonction de démontage.
 *
 * Utile hors React (page statique, widget) : le même composant que l'usage
 * déclaratif, sans avoir à installer une racine React côté hôte.
 */
export function mountPixelEditor(element: HTMLElement, props: PixelEditorProps = {}): () => void {
  const root = createRoot(element);
  root.render(createElement(PixelEditor, props));
  return () => root.unmount();
}
