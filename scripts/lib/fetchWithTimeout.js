/**
 * Helper réseau partagé pour les scrapers.
 *
 * node-fetch ne dispose plus d'option `timeout` (v3) : on implémente le
 * timeout via AbortController pour éviter qu'une requête reste pendante
 * indéfiniment et bloque le processus (ex: site distant qui ne répond pas).
 */

import fetch from 'node-fetch';

/** Timeout par défaut (ms) pour toutes les requêtes de scraping. */
export const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Comme fetch(), mais avec un timeout garanti.
 * @param {string} url - URL à récupérer.
 * @param {import('node-fetch').RequestInit} [options] - Options fetch (headers, etc.).
 * @param {number} [timeoutMs] - Timeout en millisecondes (défaut: 30s).
 * @returns {Promise<import('node-fetch').Response>}
 * @throws {Error} - Erreur avec message explicite si le timeout est dépassé.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      throw new Error(`Timeout après ${timeoutMs}ms: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
