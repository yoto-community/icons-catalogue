import { useReducer, type Dispatch } from 'react';
import {
  createEditorState,
  editorReducer,
  type EditorAction,
  type EditorState,
  type PixelGrid,
} from '../utils/pixelEditor';

/** Interface exposée par le hook. */
export interface UsePixelEditorResult {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Enveloppe React du réducteur pur `editorReducer` (cf. `utils/pixelEditor.ts`).
 * Toute la logique vit dans le module pur ; ce hook ne fait que câbler
 * `useReducer` et exposer les drapeaux dérivés d'undo/redo.
 */
export function usePixelEditor(initialGrid?: PixelGrid): UsePixelEditorResult {
  const [state, dispatch] = useReducer(editorReducer, initialGrid, createEditorState);

  return {
    state,
    dispatch,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
