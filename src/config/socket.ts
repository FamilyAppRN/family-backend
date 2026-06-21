import { Server as SocketServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { ENV } from './env.js';

let io: SocketServer | null = null;

export function initSocket(server: HttpServer): SocketServer {
  if (io) {
    console.warn('Socket.IO is already initialized.');
    return io;
  }

  console.log('Initializing Socket.IO...');
  io = new SocketServer(server, {
    cors: {
      origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  return io;
}

export function getIO(): SocketServer {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initSocket first.');
  }
  return io;
}
