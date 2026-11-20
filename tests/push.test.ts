import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { PushService, type MessagingLike, type PushMessage, type PushTokenStore } from '../src/shared/push/PushService.js';

const message: PushMessage = {
  title: 'Nueva tarea',
  body: 'Ana te asignó: Sacar la basura',
  data: { type: 'task_assigned', householdId: 'house-a', taskId: 'task-1' },
};

function makeStore(tokensByUser: Record<string, string[]>) {
  const removed: string[] = [];
  const store: PushTokenStore = {
    async findTokens(userIds) {
      return userIds.flatMap((id) => tokensByUser[id] ?? []);
    },
    async removeTokens(tokens) {
      removed.push(...tokens);
    },
  };
  return { store, removed };
}

function makeMessaging(failures: Record<string, string> = {}) {
  const calls: { tokens: string[]; data: Record<string, string> }[] = [];
  const messaging: MessagingLike = {
    async sendEachForMulticast({ tokens, data }) {
      calls.push({ tokens, data });
      return {
        responses: tokens.map((token) =>
          failures[token] ? { success: false, error: { code: failures[token] } } : { success: true },
        ),
      };
    },
  };
  return { messaging, calls };
}

describe('PushService', () => {
  test('envía a los tokens de los usuarios, sin repetir usuarios', async () => {
    const { store } = makeStore({ carlos: ['t-carlos-1', 't-carlos-2'], sofia: ['t-sofia'] });
    const { messaging, calls } = makeMessaging();

    await new PushService(store, () => messaging).sendToUsers(['carlos', 'sofia', 'carlos'], message);

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].tokens, ['t-carlos-1', 't-carlos-2', 't-sofia']);
    assert.deepEqual(calls[0].data, { type: 'task_assigned', householdId: 'house-a', taskId: 'task-1' });
  });

  test('borra solo los tokens que FCM marca como inválidos', async () => {
    const { store, removed } = makeStore({ carlos: ['t-ok', 't-dead', 't-busy'] });
    const { messaging } = makeMessaging({
      't-dead': 'messaging/registration-token-not-registered',
      't-busy': 'messaging/server-unavailable',
    });

    await new PushService(store, () => messaging).sendToUsers(['carlos'], message);

    assert.deepEqual(removed, ['t-dead']);
  });

  test('no llama a FCM si no hay destinatarios o tokens', async () => {
    const { store } = makeStore({});
    const { messaging, calls } = makeMessaging();
    const service = new PushService(store, () => messaging);

    await service.sendToUsers([], message);
    await service.sendToUsers(['sin-tokens'], message);

    assert.equal(calls.length, 0);
  });

  test('si FCM falla no lanza (la acción que lo disparó sigue)', async () => {
    const { store } = makeStore({ carlos: ['t-1'] });
    const broken: MessagingLike = {
      async sendEachForMulticast() {
        throw new Error('FCM caído');
      },
    };

    await assert.doesNotReject(new PushService(store, () => broken).sendToUsers(['carlos'], message));
  });

  test('envía en tandas de 500 tokens', async () => {
    const tokens = Array.from({ length: 1201 }, (_, i) => `t-${i}`);
    const { store } = makeStore({ muchos: tokens });
    const { messaging, calls } = makeMessaging();

    await new PushService(store, () => messaging).sendToUsers(['muchos'], message);

    assert.deepEqual(calls.map((c) => c.tokens.length), [500, 500, 201]);
  });
});
