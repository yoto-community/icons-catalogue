import { useCallback, useEffect, useState } from 'react';
import { AUTOSAVE_DELAY_MS, DRAFT_STORAGE_KEY } from '@yoto-community/pixel-editor-core';
import { clearDraft, loadDraft, saveDraft } from '@yoto-community/pixel-editor-core';
import { isEmpty, type PixelGrid } from '@yoto-community/pixel-editor-core';

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
 * brouillon). `storageKey` permet à l'hôte d'isoler ses brouillons.
 */
export function useEditorDraft(
  grid: PixelGrid | null,
  delayMs: number = AUTOSAVE_DELAY_MS,
  storageKey: string = DRAFT_STORAGE_KEY
): UseEditorDraftResult {
  const [restoredDraft, setRestoredDraft] = useState<PixelGrid | null>(() => loadDraft(storageKey));

  useEffect(() => {
    // Rien à sauvegarder sans grille, ni pour une grille vide (un brouillon
    // transparent n'a aucune valeur et ferait réapparaître une bannière de
    // reprise après un « repartir de zéro »).
    if (!grid || isEmpty(grid)) return;
    const timer = setTimeout(() => {
      saveDraft(grid, storageKey);
    }, delayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [grid, delayMs, storageKey]);

  const clear = useCallback(() => {
    clearDraft(storageKey);
    setRestoredDraft(null);
  }, [storageKey]);

  return { restoredDraft, hasDraft: restoredDraft !== null, clear };
}
