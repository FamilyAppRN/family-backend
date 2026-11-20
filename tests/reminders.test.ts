import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { isDateOnly, shouldRemind } from '../src/jobs/reminderSchedule.js';

// Caracas es UTC-4 todo el año: 00:00 local = 04:00Z.
const TZ = 'America/Caracas';
const at = (iso: string) => new Date(iso);

describe('recordatorios: cuándo avisar', () => {
  test('con hora: dentro de la hora previa al vencimiento', () => {
    const due = at('2026-11-10T20:30:00Z'); // 16:30 en Caracas
    assert.equal(shouldRemind(due, TZ, at('2026-11-10T19:20:00Z')), false, 'falta más de una hora');
    assert.equal(shouldRemind(due, TZ, at('2026-11-10T19:40:00Z')), true, '50 minutos antes');
    assert.equal(shouldRemind(due, TZ, at('2026-11-10T20:31:00Z')), false, 'ya venció');
  });

  test('sin hora: a las 8:00 locales de ese día, no la noche anterior', () => {
    const due = at('2026-11-10T04:00:00Z'); // 00:00 del 10 en Caracas
    assert.equal(isDateOnly(due, TZ), true);
    assert.equal(shouldRemind(due, TZ, at('2026-11-10T03:30:00Z')), false, '23:30 del día anterior');
    assert.equal(shouldRemind(due, TZ, at('2026-11-10T11:55:00Z')), false, '07:55 local');
    assert.equal(shouldRemind(due, TZ, at('2026-11-10T12:05:00Z')), true, '08:05 local');
    assert.equal(shouldRemind(due, TZ, at('2026-11-11T04:01:00Z')), false, 'ya pasó el día');
  });

  test('la medianoche se mide en la zona del hogar', () => {
    assert.equal(isDateOnly(at('2026-11-10T04:00:00Z'), TZ), true);
    assert.equal(isDateOnly(at('2026-11-10T04:00:00Z'), 'UTC'), false);
    assert.equal(isDateOnly(at('2026-11-10T00:00:00Z'), 'Zona/Invalida'), true, 'zona inválida usa UTC');
  });
});
