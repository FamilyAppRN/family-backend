import admin from 'firebase-admin';
import { User } from '../../models/User.js';
import logger from '../infrastructure/logger.js';

/** Qué abre la app al tocar el aviso. Viaja en `data` (FCM solo admite strings). */
export type PushType = 'task_assigned' | 'task_reminder' | 'urgent_item' | 'going_shopping' | 'member_joined';

export interface PushMessage {
  title: string;
  body: string;
  data: { type: PushType; householdId: string; taskId?: string };
}

export interface PushTokenStore {
  /** Tokens de los usuarios que tienen las notificaciones activadas. */
  findTokens(userIds: string[]): Promise<string[]>;
  removeTokens(tokens: string[]): Promise<void>;
}

/** La parte de firebase-admin messaging que se usa (permite un doble en tests). */
export interface MessagingLike {
  sendEachForMulticast(message: {
    tokens: string[];
    notification: { title: string; body: string };
    data: Record<string, string>;
    android?: { priority: 'high' | 'normal' };
    apns?: { payload: { aps: { sound: string } } };
  }): Promise<{ responses: { success: boolean; error?: { code: string } }[] }>;
}

/** FCM acepta hasta 500 tokens por envío. */
const BATCH_SIZE = 500;

/** Errores que significan que el token ya no sirve y hay que borrarlo. */
const INVALID_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

export class PushService {
  constructor(
    private readonly store: PushTokenStore,
    private readonly messaging: () => MessagingLike,
  ) {}

  /**
   * Envía a esos usuarios. Nunca lanza: un aviso que falla no debe romper la
   * acción que lo disparó, así que el error se registra y se sigue.
   */
  async sendToUsers(userIds: string[], message: PushMessage): Promise<void> {
    try {
      const uniqueIds = [...new Set(userIds)].filter(Boolean);
      if (uniqueIds.length === 0) return;

      const tokens = await this.store.findTokens(uniqueIds);
      if (tokens.length === 0) return;

      const data: Record<string, string> = Object.fromEntries(
        Object.entries(message.data).filter(([, value]) => value !== undefined) as [string, string][],
      );
      const invalid: string[] = [];

      for (let start = 0; start < tokens.length; start += BATCH_SIZE) {
        const batch = tokens.slice(start, start + BATCH_SIZE);
        const result = await this.messaging().sendEachForMulticast({
          tokens: batch,
          notification: { title: message.title, body: message.body },
          data,
          android: { priority: 'high' },
          apns: { payload: { aps: { sound: 'default' } } },
        });
        result.responses.forEach((response, index) => {
          const token = batch[index];
          if (token && !response.success && response.error && INVALID_TOKEN_CODES.has(response.error.code)) {
            invalid.push(token);
          }
        });
      }

      if (invalid.length > 0) await this.store.removeTokens(invalid);
    } catch (error) {
      logger.error({ err: error, type: message.data.type }, 'No se pudo enviar el aviso push');
    }
  }
}

const mongoTokenStore: PushTokenStore = {
  async findTokens(userIds) {
    const users = await User.find(
      { _id: { $in: userIds }, notifications_enabled: true },
      { push_tokens: 1 },
    ).lean();
    return users.flatMap((user) => (user.push_tokens ?? []).map((t) => t.token));
  },
  async removeTokens(tokens) {
    await User.updateMany(
      { 'push_tokens.token': { $in: tokens } },
      { $pull: { push_tokens: { token: { $in: tokens } } } } as any,
    );
  },
};

export const pushService = new PushService(mongoTokenStore, () => admin.messaging() as unknown as MessagingLike);
