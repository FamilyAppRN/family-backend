import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { Household } from '../models/Household.js';
import { User } from '../models/User.js';
import logger from './infrastructure/logger.js';

// Initialize the Expo SDK client
const expo = new Expo();

export interface NotifyPayload {
  tokens: string[]; // Recipients' Expo push tokens
  title: string;
  body: string;
  data?: Record<string, unknown>; // Deep links, navigational metadata, IDs
}

/**
 * Sends push notifications using Expo Push API
 */
export async function sendPushNotifications(payload: NotifyPayload): Promise<void> {
  const messages: ExpoPushMessage[] = payload.tokens
    .filter((token) => Expo.isExpoPushToken(token))
    .map((token) => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default',
    }));

  const chunks = expo.chunkPushNotifications(messages);
  
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      // In production: process ticketChunk to log failures and prune expired tokens
    } catch (error) {
      logger.error({ err: error }, '❌ Error sending push notification chunk');
    }
  }
}

/**
 * Retrieves push tokens of all household members except the initiator (actor)
 */
export async function getHouseholdTokens(
  householdId: string,
  excludeUserId: string
): Promise<string[]> {
  const household = await Household.findById(householdId).lean();
  if (!household) {
    return [];
  }

  const memberIds = household.members
    .map((m) => m.user_id)
    .filter((id) => id.toString() !== excludeUserId);

  const users = await User.find(
    { _id: { $in: memberIds }, notifications_enabled: true },
    { push_tokens: 1 }
  ).lean();

  return users.flatMap((u) => u.push_tokens.map((t) => t.token));
}
