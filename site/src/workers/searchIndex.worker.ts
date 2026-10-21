/// <reference lib="webworker" />
import type lunr from 'lunr';
import { buildSearchIndex, type SearchableIcon } from '../searchIndex';

/**
 * Web Worker chargé de construire et de conserver l'index Lunr.
 *
 * Intérêt : la construction coûte ~1,5 s pour 27 000 icônes. Exécutée ici,
 * elle ne bloque jamais le main thread (pas de frame gelée à l'ouverture).
 * L'index ne quitte jamais le worker : seules les requêtes et les IDs
 * circulent, donc aucun coût de sérialisation de l'index.
 */

type WorkerRequest =
  { type: 'build'; icons: SearchableIcon[] } | { type: 'search'; id: number; query: string };

let index: lunr.Index | null = null;
let building = false;
/** Requêtes reçues pendant la construction : rejouées une fois l'index prêt. */
const pendingSearches: Array<{ id: number; query: string }> = [];

function runSearch(id: number, query: string): void {
  if (!index) return;
  try {
    const results = index.search(query);
    self.postMessage({ type: 'results', id, ids: results.map((r) => r.ref) });
  } catch {
    // Requête malformée côté client (ex: opérateur orphelin) : on renvoie
    // un résultat vide plutôt que de faire échouer tout le pipeline.
    self.postMessage({ type: 'results', id, ids: [] });
  }
}

function flushPendingSearches(): void {
  while (pendingSearches.length > 0) {
    const pending = pendingSearches.shift();
    if (pending) runSearch(pending.id, pending.query);
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  if (message.type === 'build') {
    if (index || building) return; // déjà prêt ou en cours
    building = true;
    try {
      index = buildSearchIndex(message.icons);
      self.postMessage({ type: 'ready', count: message.icons.length });
      flushPendingSearches();
    } catch (error) {
      self.postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Index build failed',
      });
    } finally {
      building = false;
    }
    return;
  }

  if (message.type === 'search') {
    if (index) {
      runSearch(message.id, message.query);
    } else {
      // Bufferiser : la réponse partira dès que l'index sera prêt.
      pendingSearches.push({ id: message.id, query: message.query });
    }
  }
};
