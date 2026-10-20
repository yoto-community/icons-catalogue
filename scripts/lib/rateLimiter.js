/**
 * Limitation de débit et reprises pour les scrapers.
 *
 * Les scrapers contrôlaient déjà leur concurrence (lots + délais), mais un
 * échec transitoire (429 Too Many Requests, 5xx, coupure réseau) faisait
 * échouer définitivement la page. Ce module ajoute :
 *  - `fetchWithRetry` : reprise avec backoff exponentiel + gigue, en respectant
 *    l'en-tête `Retry-After` des serveurs.
 *  - `RateLimiter` : limiteur concurrence + espacement minimal (token bucket).
 */

import { fetchWithTimeout } from './fetchWithTimeout.js';

/** Dors en millisecondes. */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calcule le délai de backoff exponentiel pour une tentative donnée.
 *
 * @param {number} attempt - Indice de tentative (0 = première reprise).
 * @param {object} [opts]
 * @param {number} [opts.baseMs=1000] - Délai de base.
 * @param {number} [opts.maxMs=30000] - Plafond.
 * @param {boolean} [opts.jitter=true] - Ajoute de la gigue (évite le Thundering Herd).
 * @returns {number} Délai en ms.
 */
export function computeBackoff(attempt, { baseMs = 1000, maxMs = 30_000, jitter = true } = {}) {
  const exponential = Math.min(maxMs, baseMs * 2 ** attempt);
  // Gigue : entre 50 % et 100 % du délai théorique.
  return jitter ? Math.round(exponential * (0.5 + Math.random() * 0.5)) : exponential;
}

/** Indique si un code HTTP est transitoire (donc réessayable). */
export function isRetryableStatus(status) {
  return status === 429 || status >= 500;
}

/**
 * Comme fetchWithTimeout, mais avec reprise sur les échecs transitoires.
 *
 * @param {string} url
 * @param {import('node-fetch').RequestInit} [options]
 * @param {object} [opts]
 * @param {number} [opts.retries=3] - Nombre de reprises max (au-delà : échec).
 * @param {number} [opts.baseDelayMs=1000] - Base du backoff exponentiel.
 * @param {number} [opts.timeoutMs] - Timeout par requête (délègue à fetchWithTimeout).
 * @returns {Promise<import('node-fetch').Response>} Réponse non-429/5xx finale.
 * @throws {Error} Si toutes les tentatives échouent.
 */
export async function fetchWithRetry(
  url,
  options = {},
  { retries = 3, baseDelayMs = 1000, timeoutMs } = {}
) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, timeoutMs);

      if (!isRetryableStatus(res.status)) {
        return res;
      }

      lastError = new Error(`HTTP ${res.status} pour ${url}`);

      // Respecter Retry-After (secondes) si le serveur l'envoie (cas du 429).
      const retryAfter = Number(res.headers?.get?.('retry-after'));
      const serverDelay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : null;

      if (attempt < retries) {
        await sleep(serverDelay ?? computeBackoff(attempt, { baseMs: baseDelayMs }));
        continue;
      }
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(computeBackoff(attempt, { baseMs: baseDelayMs }));
        continue;
      }
    }
  }

  throw lastError;
}

/**
 * Limiteur de débit : concurrence maximale + espacement minimal entre prises.
 *
 * @example
 * const limiter = new RateLimiter({ maxConcurrent: 3, minDelayMs: 200 });
 * const html = await limiter.schedule(() => fetchPage(n));
 */
export class RateLimiter {
  /**
   * @param {object} [opts]
   * @param {number} [opts.maxConcurrent=3] - Requêtes simultanées max.
   * @param {number} [opts.minDelayMs=0] - Délai minimal entre deux prises de slot.
   */
  constructor({ maxConcurrent = 3, minDelayMs = 0 } = {}) {
    this.maxConcurrent = maxConcurrent;
    this.minDelayMs = minDelayMs;
    this.active = 0;
    this.queue = [];
    this.lastAcquire = 0;
    this._drain();
  }

  _drain() {
    while (this.queue.length > 0 && this.active < this.maxConcurrent) {
      const { resolve } = this.queue.shift();
      this.active++;
      // Espacement minimal entre deux acququisitions de slot.
      const sinceLast = Date.now() - this.lastAcquire;
      this.lastAcquire = Date.now();
      const wait = Math.max(0, this.minDelayMs - sinceLast);
      if (wait > 0) {
        setTimeout(() => resolve(), wait);
      } else {
        resolve();
      }
    }
  }

  /** Attend qu'un slot soit libre. */
  acquire() {
    return new Promise(resolve => {
      this.queue.push({ resolve });
      this._drain();
    });
  }

  /** Libère un slot. */
  release() {
    this.active = Math.max(0, this.active - 1);
    this._drain();
  }

  /**
   * Exécute `fn` en contrôlant la concurrence. Libère toujours le slot.
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async schedule(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}
