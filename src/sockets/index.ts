import { Server } from 'socket.io';
import { registerSocketAuth } from './auth.js';
import { registerHouseholdSocket } from './household.socket.js';

export function registerSocketEvents(io: Server): void {
  registerSocketAuth(io);

  io.on('connection', (socket) => {
    registerHouseholdSocket(io, socket);
  });
}
