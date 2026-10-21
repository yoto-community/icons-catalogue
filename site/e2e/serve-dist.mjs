#!/usr/bin/env node
/**
 * Serveur statique reproduisant le comportement de GitHub Pages, utilisé par les
 * tests E2E du repli SPA.
 *
 * Différence clé avec `vite preview` : GitHub Pages **ne fait pas de repli SPA**.
 * Toute URL inconnue renvoie le statut **404** avec le corps de `dist/404.html`.
 * `vite preview` masquerait la régression en servant `index.html` pour toutes les
 * routes.
 *
 * Tant que `dist/index.html` n'existe pas (build en cours), le serveur répond
 * **503** afin que Playwright attende la fin de la build avant de lancer les
 * tests.
 */
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BASE = '/icons-catalogue';
const PORT = Number(process.env.SPA_FALLBACK_PORT ?? 4174);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.bin': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
};

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': type });
  res.end(body);
}

const server = createServer((req, res) => {
  // Build non terminée : on répond 503 pour que Playwright patiente.
  if (!existsSync(join(DIST_DIR, 'index.html'))) {
    send(res, 503, 'Build en cours…');
    return;
  }

  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  if (!pathname.startsWith(BASE)) {
    send(res, 404, 'Not found');
    return;
  }

  let relative = pathname.slice(BASE.length);
  if (relative === '' || relative.endsWith('/')) relative += 'index.html';

  const target = normalize(join(DIST_DIR, relative));
  if (target !== DIST_DIR && !target.startsWith(DIST_DIR)) {
    send(res, 403, 'Forbidden');
    return;
  }

  if (existsSync(target) && statSync(target).isFile()) {
    send(res, 200, readFileSync(target), MIME_TYPES[extname(target)] ?? 'application/octet-stream');
    return;
  }

  // Comportement GitHub Pages : 404 + corps de 404.html.
  const fallback = join(DIST_DIR, '404.html');
  if (existsSync(fallback)) {
    send(res, 404, readFileSync(fallback), MIME_TYPES['.html']);
    return;
  }
  send(res, 404, 'Not found');
});

server.listen(PORT, () => {
  console.log(`GitHub-Pages-like static server → http://localhost:${PORT}${BASE}/`);
});
