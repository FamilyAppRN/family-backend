import { Server } from 'socket.io';
import { registerHouseholdSocket } from './household.socket.js';

export function registerSocketEvents(io: Server): void {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected to Socket.IO: ${socket.id}`);

    // Register household room management events
    registerHouseholdSocket(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected from Socket.IO: ${socket.id} (Reason: ${reason})`);
    });
  });
}
