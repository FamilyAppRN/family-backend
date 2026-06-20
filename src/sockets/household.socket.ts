import { Server, Socket } from 'socket.io';

export function registerHouseholdSocket(io: Server, socket: Socket): void {
  // Client joins the household room on app launch / switching household
  socket.on('join:household', (householdId: string) => {
    if (!householdId) {
      return;
    }
    const roomName = `household:${householdId}`;
    socket.join(roomName);
    console.log(`🔌 Socket ${socket.id} joined room: ${roomName}`);
  });

  // Client leaves the household room
  socket.on('leave:household', (householdId: string) => {
    if (!householdId) {
      return;
    }
    const roomName = `household:${householdId}`;
    socket.leave(roomName);
    console.log(`🔌 Socket ${socket.id} left room: ${roomName}`);
  });
}
