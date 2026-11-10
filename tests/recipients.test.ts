import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { newAssigneeRecipient, otherMembers, reminderRecipients } from '../src/shared/push/recipients.js';

describe('a quién avisar (reglas-para-push.md)', () => {
  test('urgente, voy al súper y nuevo miembro: todos menos quien lo hizo', () => {
    assert.deepEqual(otherMembers(['ana', 'carlos', 'sofia'], 'ana'), ['carlos', 'sofia']);
    assert.deepEqual(otherMembers(['ana'], 'ana'), []);
    assert.deepEqual(otherMembers(['ana', 'carlos', 'carlos'], 'ana'), ['carlos']);
  });

  test('tarea asignada: solo a quien la recibe', () => {
    assert.deepEqual(newAssigneeRecipient('carlos', 'ana'), ['carlos']);
  });

  test('tarea asignada: no avisa si te la asignas tú', () => {
    assert.deepEqual(newAssigneeRecipient('ana', 'ana'), []);
  });

  test('tarea asignada: no avisa si el asignado no cambió o se quitó', () => {
    assert.deepEqual(newAssigneeRecipient('carlos', 'ana', 'carlos'), []);
    assert.deepEqual(newAssigneeRecipient(null, 'ana', 'carlos'), []);
  });

  test('recordatorio: al asignado, o a todo el hogar si nadie la tiene', () => {
    assert.deepEqual(reminderRecipients('carlos', ['ana', 'carlos']), ['carlos']);
    assert.deepEqual(reminderRecipients(null, ['ana', 'carlos']), ['ana', 'carlos']);
  });
});
