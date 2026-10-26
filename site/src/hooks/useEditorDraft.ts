import { useCallback, useEffect, useState } from 'react';
import { AUTOSAVE_DELAY_MS } from '../constants/editor';
import { clearDraft, loadDraft, saveDraft } from '../utils/editorStorage';
import { isEmpty, type PixelGrid } from '../utils/pixelEditor';

/** Interface exposée par le hook. */
export interface UseEditorDraftResult {
  /** Brouillon relu au montage (à charger dans l'éditeur), sinon `null`. */
  restoredDraft: PixelGrid | null;
  /** Indique la présence d'un brouillon exploitable. */
  hasDraft: boolean;
  /** Purge le brouillon stocké et l'état associé. */
  clear: () => void;
}

/**
 * Persistance du brouillon (E5) : relit un éventuel brouillon au montage et
 * **auto-sauvegarde** la grille courante après un court délai (`delayMs`), de
 * façon à éviter une écriture `localStorage` à chaque pixel pendant un tracé.
 *
 * `grid` à `null` désactive l'auto-sauvegarde (écran de démarrage sans
 * brouillon).
 */
export function useEditorDraft(
  grid: PixelGrid | null,
  delayMs: number = AUTOSAVE_DELAY_MS
): UseEditorDraftResult {
  const [restoredDraft, setRestoredDraft] = useState<PixelGrid | null>(() => loadDraft());

  useEffect(() => {
    // Rien à sauvegarder sans grille, ni pour une grille vide (un brouillon
    // transparent n'a aucune valeur et ferait réapparaître une bannière de
    // reprise après un « repartir de zéro »).
    if (!grid || isEmpty(grid)) return;
    const timer = setTimeout(() => {
      saveDraft(grid);
    }, delayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [grid, delayMs]);

  const clear = useCallback(() => {
    clearDraft();
    setRestoredDraft(null);
  }, []);

  return { restoredDraft, hasDraft: restoredDraft !== null, clear };
}
