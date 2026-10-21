import '@testing-library/jest-dom/vitest';

/**
 * jsdom n'implémente pas le routage réseau : toute requête relative échoue
 * (« Invalid URL »). On fournit un stub qui simule un 404 pour les tests qui
 * ne stubbent pas explicitement `fetch` (les appels réseau réels n'ont pas
 * leur place dans les tests unitaires), sans bruit de log.
 */
if (typeof globalThis.fetch === 'function') {
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response('Not Found (stub jsdom)', {
        status: 404,
        statusText: 'Not Found',
      })
    )) as typeof fetch;
}
