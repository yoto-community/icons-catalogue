import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeBackoff, isRetryableStatus, RateLimiter, sleep } from './rateLimiter.js';

test('isRetryableStatus marque 429 et 5xx comme réessayables', () => {
  assert.equal(isRetryableStatus(429), true);
  assert.equal(isRetryableStatus(500), true);
  assert.equal(isRetryableStatus(503), true);
  assert.equal(isRetryableStatus(404), false);
  assert.equal(isRetryableStatus(200), false);
  assert.equal(isRetryableStatus(301), false);
});

test('computeBackoff croît exponentiellement et respecte le plafond', () => {
  const d0 = computeBackoff(0, { baseMs: 1000, jitter: false });
  const d1 = computeBackoff(1, { baseMs: 1000, jitter: false });
  const d2 = computeBackoff(2, { baseMs: 1000, jitter: false });
  assert.equal(d0, 1000);
  assert.equal(d1, 2000);
  assert.equal(d2, 4000);
  // Plafond
  const capped = computeBackoff(10, { baseMs: 1000, maxMs: 30_000, jitter: false });
  assert.equal(capped, 30_000);
});

test('computeBackoff avec gigue reste dans [50 %, 100 %] du théorique', () => {
  for (let i = 0; i < 50; i++) {
    const d = computeBackoff(2, { baseMs: 1000, jitter: true });
    assert.ok(d >= 2000 * 0.5 && d <= 4000, `délai hors bornes: ${d}`);
  }
});

test('RateLimiter ne dépasse jamais la concurrence maximale', async () => {
  const limiter = new RateLimiter({ maxConcurrent: 2, minDelayMs: 0 });
  let active = 0;
  let peak = 0;

  const task = () =>
    limiter.schedule(async () => {
      active++;
      peak = Math.max(peak, active);
      await sleep(10);
      active--;
    });

  await Promise.all(Array.from({ length: 6 }, task));

  assert.equal(peak, 2, `concurrence pic ${peak} > 2`);
  assert.equal(active, 0, 'tous les slots libérés');
  assert.equal(limiter.active, 0, 'compteur interne remis à zéro');
});

test('RateLimiter libère le slot même si la tâche échoue', async () => {
  const limiter = new RateLimiter({ maxConcurrent: 1 });
  await assert.rejects(
    () =>
      limiter.schedule(async () => {
        throw new Error('échec volontaire');
      }),
    /échec volontaire/
  );
  assert.equal(limiter.active, 0, 'slot libéré malgré l’erreur');
});

test('sleep attend la durée demandée', async () => {
  const start = Date.now();
  await sleep(30);
  assert.ok(Date.now() - start >= 25, 'sleep trop court');
});
