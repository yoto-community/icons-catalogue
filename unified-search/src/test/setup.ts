import '@testing-library/jest-dom/vitest';

/**
 * jsdom n'implémente pas le routage réseau : toute requête relative échoue
 * (« Invalid URL »). On fournit un stub qui simule un 404 pour déclencher
 * le repli sur les traductions embarquées (import JSON), sans bruit de log.
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
