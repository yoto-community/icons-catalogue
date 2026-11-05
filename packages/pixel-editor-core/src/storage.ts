/**
 * Persistance du brouillon de l'éditeur (exigence E5).
 *
 * Le **travail en cours** est conservé dans `localStorage` : aucune icône
 * n'est publiée ni envoyée à un serveur, il s'agit uniquement de ne pas perdre
 * la retouche en cours entre deux visites.
 *
 * La clé de stockage est **fournie par l'appelant** : le cœur ne connaît pas
 * l'application qui l'utilise, ce qui permet plusieurs éditeurs indépendants
 * sur une même origine.
 *
 * Robustesse : tout accès au stockage est protégé (`try/catch`). En navigation
 * privée ou en cas de quota dépassé, les fonctions échouent silencieusement
 * (`false` / `null`) plutôt que de casser l'éditeur — cf. étude §6.5 et §8.
 */

import { DRAFT_SCHEMA_VERSION, DRAFT_STORAGE_KEY } from './constants';
import { decodeGrid, encodeGrid, type PixelGrid } from './pixel-editor';

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
export function isDraftStorageAvailable(key: string = DRAFT_STORAGE_KEY): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(key, '');
    store.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Enregistre la grille comme brouillon sous `key`. Renvoie `false` si
 * l'écriture échoue (stockage indisponible, mode privé, quota). `updatedAt`
 * est injectable pour des tests déterministes.
 */
export function saveDraft(grid: PixelGrid, key: string, updatedAt: number = Date.now()): boolean {
  const store = storage();
  if (!store) return false;

  const draft: StoredDraft = { v: DRAFT_SCHEMA_VERSION, g: encodeGrid(grid), t: updatedAt };
  try {
    store.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

/**
 * Relit le brouillon stocké sous `key`. Renvoie `null` si absent, illisible,
 * de version incompatible ou si la grille encodée est corrompue.
 */
export function loadDraft(key: string): PixelGrid | null {
  const store = storage();
  if (!store) return null;

  let raw: string | null;
  try {
    raw = store.getItem(key);
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

/** Supprime le brouillon stocké sous `key` (sans lever si le stockage est indisponible). */
export function clearDraft(key: string): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(key);
  } catch {
    // Le brouillon est optionnel : un échec de purge n'est pas bloquant.
  }
}
