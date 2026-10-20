import type lunr from 'lunr';
import type { Icon } from './types';
import {
  buildSearchIndex,
  searchIdsFallback,
  toSearchableIcon,
  type SearchableIcon,
} from './searchIndex';

/**
 * Moteur de recherche du catalogue.
 *
 * Objectif de performance : la construction de l'index Lunr coûte ~1,5 s
 * pour 27 000 icônes. Ce module l'exécute dans un Web Worker (main thread
 * préservé) et bascule sur un repli synchronisé en cas d'indisponibilité
 * (tests, navigateur sans Worker, échec de chargement).
 */
export interface SearchEngine {
  /** Résolue une fois l'index exploitable (best-effort : le repli est immédiat). */
  readonly ready: Promise<void>;
  /** Indique si l'index principal (worker) est opérationnel. */
  isReady(): boolean;
  /** Retourne les IDs correspondant à une requête. Requête vide = tous les IDs. */
  search(query: string): Promise<string[]>;
  /** Libère les ressources (worker inclus). */
  dispose(): void;
}

type WorkerResponse =
  | { type: 'ready'; count: number }
  | { type: 'results'; id: number; ids: string[] }
  | { type: 'error'; message: string };

interface SearchEngineOptions {
  /** Force le repli main-thread (utile pour les tests). */
  disableWorker?: boolean;
}

/**
 * Délai maximal d'attente d'un signal du worker avant bascule forcée sur le
 * repli : un worker qui échoue « en silence » (ni ready, ni error, ni onerror)
 * ne doit pas laisser la promesse `ready` pendante à vie.
 */
export const WORKER_READY_TIMEOUT_MS = 10_000;

export function createSearchEngine(icons: Icon[], options: SearchEngineOptions = {}): SearchEngine {
  const searchable: SearchableIcon[] = icons.map(toSearchableIcon);
  const allIds = searchable.map((icon) => icon.id);

  let disposed = false;
  let worker: Worker | null = null;
  let workerReady = false;
  /** Timer de surveillance du démarrage du worker (annulé au premier signal). */
  let readyWatchdog: ReturnType<typeof setTimeout> | null = null;
  /** Index de repli, construit sur le main thread uniquement si nécessaire. */
  let fallbackIndex: lunr.Index | null = null;

  // Corrélation requête -> promise (les réponses du worker portent un id).
  let nextRequestId = 1;
  const pending = new Map<number, (ids: string[]) => void>();

  const supportsWorker =
    !options.disableWorker && typeof Worker !== 'undefined' && typeof URL !== 'undefined';

  const ready = new Promise<void>((resolve) => {
    if (!supportsWorker) {
      // Repli : on ne pré-construit rien (coût évité tant que l'utilisateur
      // ne cherche pas). L'index sera bâti à la première recherche.
      resolve();
      return;
    }

    try {
      worker = new Worker(new URL('./workers/searchIndex.worker.ts', import.meta.url), {
        type: 'module',
      });
    } catch {
      worker = null;
      resolve();
      return;
    }

    // Filet de sécurité : si aucune nouvelle n'arrive du worker dans les
    // délais, on le termine et on libère `ready` (repli main-thread garanti).
    readyWatchdog = setTimeout(() => {
      if (workerReady) return;
      if (worker) {
        worker.terminate();
        worker = null;
      }
      resolve();
    }, WORKER_READY_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;
      if (message.type === 'ready') {
        if (readyWatchdog !== null) {
          clearTimeout(readyWatchdog);
          readyWatchdog = null;
        }
        workerReady = true;
        resolve();
        return;
      }
      if (message.type === 'error') {
        if (readyWatchdog !== null) {
          clearTimeout(readyWatchdog);
          readyWatchdog = null;
        }
        worker = null; // bascule définitive sur le repli
        resolve();
        return;
      }
      if (message.type === 'results') {
        const resolveRequest = pending.get(message.id);
        if (resolveRequest) {
          pending.delete(message.id);
          resolveRequest(message.ids);
        }
      }
    };

    worker.onerror = () => {
      if (readyWatchdog !== null) {
        clearTimeout(readyWatchdog);
        readyWatchdog = null;
      }
      worker = null;
      resolve();
    };

    // Transfert des données minimales puis déclenchement de la construction.
    worker.postMessage({ type: 'build', icons: searchable });
  });

  /** Repli : construit (une seule fois) et conserve un index sur le main thread. */
  function getFallbackIndex(): lunr.Index {
    if (!fallbackIndex) {
      fallbackIndex = buildSearchIndex(searchable);
    }
    return fallbackIndex;
  }

  return {
    ready,
    isReady: () => workerReady && worker !== null && !disposed,
    search(query: string): Promise<string[]> {
      if (disposed) return Promise.resolve([]);
      const trimmed = query.trim();
      if (!trimmed) return Promise.resolve(allIds);

      // Voie rapide : index déjà prêt dans le worker (aucune sérialisation).
      if (worker && workerReady) {
        return new Promise<string[]>((resolve) => {
          const id = nextRequestId++;
          pending.set(id, resolve);
          worker!.postMessage({ type: 'search', id, query: trimmed });
        });
      }

      // Repli main-thread (asynchrone pour respecter la même signature).
      return Promise.resolve().then(() => {
        try {
          return getFallbackIndex()
            .search(trimmed)
            .map((result) => result.ref);
        } catch {
          // Requête malformée (opérateur orphelin…) : repli « naïf » lisible.
          return Array.from(searchIdsFallback(searchable, trimmed));
        }
      });
    },
    dispose(): void {
      disposed = true;
      pending.clear();
      fallbackIndex = null;
      if (readyWatchdog !== null) {
        clearTimeout(readyWatchdog);
        readyWatchdog = null;
      }
      if (worker) {
        worker.terminate();
        worker = null;
      }
    },
  };
}
