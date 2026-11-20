import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { AttemptLimiter } from '../src/shared/infrastructure/http/AttemptLimiter.js';

describe('límite de intentos al unirse', () => {
  test('bloquea tras 5 fallos y se libera al pasar la ventana', () => {
    let now = 0;
    const limiter = new AttemptLimiter(5, 15 * 60 * 1000, () => now);
    for (let i = 0; i < 4; i++) limiter.recordFailure('ana');
    assert.equal(limiter.isBlocked('ana'), false, '4 fallos todavía permiten intentar');
    limiter.recordFailure('ana');
    assert.equal(limiter.isBlocked('ana'), true);
    assert.equal(limiter.isBlocked('carlos'), false, 'cada usuario cuenta aparte');

    now = 15 * 60 * 1000 + 1;
    assert.equal(limiter.isBlocked('ana'), false, 'pasada la ventana vuelve a poder');
  });

  test('un acierto borra los fallos', () => {
    const limiter = new AttemptLimiter(5, 60_000, () => 0);
    for (let i = 0; i < 4; i++) limiter.recordFailure('ana');
    limiter.reset('ana');
    for (let i = 0; i < 4; i++) limiter.recordFailure('ana');
    assert.equal(limiter.isBlocked('ana'), false);
  });
});
