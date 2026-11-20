import type { Server } from 'socket.io';
import admin from 'firebase-admin';
import { User } from '../models/User.js';

export interface SocketData {
  userId: string;
}

/**
 * Exige el mismo token de Firebase que la API, enviado en
 * `io(url, { auth: { token } })`. Sin token válido la conexión se rechaza.
 */
export function registerSocketAuth(io: Server): void {
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (typeof token !== 'string' || token.length === 0) {
      return next(new Error('AUTH_MISSING_TOKEN'));
    }
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      const user = await User.findOne({ firebase_uid: decoded.uid }, { _id: 1 }).lean();
      if (!user) return next(new Error('AUTH_USER_NOT_FOUND'));
      (socket.data as SocketData).userId = user._id.toString();
      next();
    } catch {
      next(new Error('AUTH_INVALID_TOKEN'));
    }
  });
}
