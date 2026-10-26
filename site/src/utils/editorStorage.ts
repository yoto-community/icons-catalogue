/**
 * Persistance du brouillon de l'éditeur (exigence E5).
 *
 * Le **travail en cours** est conservé dans `localStorage` : aucune icône
 * n'est publiée ni envoyée à un serveur, il s'agit uniquement de ne pas perdre
 * la retouche en cours entre deux visites.
 *
 * Robustesse : tout accès au stockage est protégé (`try/catch`). En navigation
 * privée ou en cas de quota dépassé, les fonctions échouent silencieusement
 * (`false` / `null`) plutôt que de casser l'éditeur — cf. étude §6.5 et §8.
 */

import { DRAFT_SCHEMA_VERSION, DRAFT_STORAGE_KEY } from '../constants/editor';
import { decodeGrid, encodeGrid, type PixelGrid } from './pixelEditor';

/** Forme sérialisée du brouillon (`v` = version, `g` = grille base64, `t` = date). */
interface StoredDraft {
  v: number;
  g: string;
  t: number;
}

/** Renvoie le stockage local, ou `null` s'il est indisponible. */
function storage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

/** Indique si `localStorage` est utilisable (sonde d'écriture/suppression). */
export function isDraftStorageAvailable(): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(DRAFT_STORAGE_KEY, '');
    store.removeItem(DRAFT_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Enregistre la grille comme brouillon. Renvoie `false` si l'écriture échoue
 * (stockage indisponible, mode privé, quota). `updatedAt` est injectable pour
 * des tests déterministes.
 */
export function saveDraft(grid: PixelGrid, updatedAt: number = Date.now()): boolean {
  const store = storage();
  if (!store) return false;

  const draft: StoredDraft = { v: DRAFT_SCHEMA_VERSION, g: encodeGrid(grid), t: updatedAt };
  try {
    store.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/**
 * Relit le brouillon. Renvoie `null` si absent, illisible, de version
 * incompatible ou si la grille encodée est corrompue.
 */
export function loadDraft(): PixelGrid | null {
  const store = storage();
  if (!store) return null;

  let raw: string | null;
  try {
    raw = store.getItem(DRAFT_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== 'object' || parsed === null) return null;

  const draft = parsed as Partial<StoredDraft>;
  if (draft.v !== DRAFT_SCHEMA_VERSION) return null;
  if (typeof draft.g !== 'string') return null;
  return decodeGrid(draft.g);
}

/** Supprime le brouillon (sans lever si le stockage est indisponible). */
export function clearDraft(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Le brouillon est optionnel : un échec de purge n'est pas bloquant.
  }
}
