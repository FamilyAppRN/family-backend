import { getIOIfReady } from '../config/socket.js';
import { householdRoom } from './household.socket.js';
import type { SocketData } from './auth.js';
import logger from '../shared/infrastructure/logger.js';

/** Qué parte del hogar cambió; la app recarga solo esa. */
export type HouseholdScope = 'shopping' | 'tasks' | 'notes' | 'household';

export interface HouseholdUpdatedEvent {
  householdId: string;
  scope: HouseholdScope;
  /** Quién hizo el cambio, para que su propia app pueda ignorarlo. */
  by: string;
}

/**
 * Avisa a la sala del hogar que algo cambió. El aviso es liviano a propósito:
 * la app vuelve a pedir los datos con sus permisos, así nunca se filtra nada
 * por el socket. No hace nada si Socket.IO no arrancó (tests, scripts).
 */
export function emitHouseholdUpdated(householdId: string | undefined | null, scope: HouseholdScope, by: string): void {
  if (!householdId) return;
  const io = getIOIfReady();
  if (!io) return;
  const event: HouseholdUpdatedEvent = { householdId, scope, by };
  io.to(householdRoom(householdId)).emit('household:updated', event);
}

/**
 * Tras quitar a alguien: le avisa para que su app suelte el hogar y saca sus
 * conexiones de la sala, para que no siga recibiendo avisos.
 */
export async function emitMemberRemoved(householdId: string, userId: string, by: string): Promise<void> {
  const io = getIOIfReady();
  if (!io) return;
  const room = householdRoom(householdId);
  io.to(room).emit('household:member-removed', { householdId, userId, by });
  try {
    const sockets = await io.in(room).fetchSockets();
    for (const socket of sockets) {
      if ((socket.data as SocketData).userId === userId) socket.leave(room);
    }
  } catch (error) {
    logger.error({ err: error }, 'No se pudo sacar al miembro quitado de la sala');
  }
}
