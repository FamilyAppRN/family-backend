import type { Server, Socket } from 'socket.io';
import { GetHouseholdUseCase } from '../modules/household/application/useCases/GetHouseholdUseCase.js';
import { assertHouseholdMembership } from '../modules/household/application/services/HouseholdMembership.js';
import { MongooseHouseholdRepository } from '../modules/household/infrastructure/persistence/MongooseHouseholdRepository.js';
import type { SocketData } from './auth.js';

export const householdRoom = (householdId: string) => `household:${householdId}`;

type Ack = (response: { ok: boolean; error?: string }) => void;

const getHouseholdUseCase = new GetHouseholdUseCase(new MongooseHouseholdRepository());

export function registerHouseholdSocket(_io: Server, socket: Socket): void {
  // Solo entra a la sala quien pertenece al hogar.
  socket.on('join:household', async (householdId: unknown, ack?: Ack) => {
    if (typeof householdId !== 'string' || householdId.length === 0) {
      ack?.({ ok: false, error: 'INVALID_HOUSEHOLD' });
      return;
    }
    try {
      await assertHouseholdMembership(getHouseholdUseCase, householdId, (socket.data as SocketData).userId);
      await socket.join(householdRoom(householdId));
      ack?.({ ok: true });
    } catch {
      ack?.({ ok: false, error: 'NOT_A_MEMBER' });
    }
  });

  socket.on('leave:household', async (householdId: unknown, ack?: Ack) => {
    if (typeof householdId === 'string') {
      await socket.leave(householdRoom(householdId));
    }
    ack?.({ ok: true });
  });
}
