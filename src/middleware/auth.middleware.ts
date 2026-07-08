import { Elysia } from 'elysia';
import admin from 'firebase-admin';
import { ApplicationError } from '../shared/domain/error.js';
import { User } from '../models/User.js';

export const authMiddleware = new Elysia()
  .derive({ as: 'global' }, async ({ headers, body }) => {
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApplicationError(401, 'No autorizado: Token faltante o formato incorrecto', 'AUTH_MISSING_TOKEN', 'AUTHENTICATION');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApplicationError(401, 'No autorizado: Token vacío', 'AUTH_MISSING_TOKEN', 'AUTHENTICATION');
    }

    try {
      // Verify token with Firebase Admin SDK
      const decoded = await admin.auth().verifyIdToken(token);
      
      const user = await User.findOne({ firebase_uid: decoded.uid }).lean();
      if (!user) {
        throw new ApplicationError(404, 'Usuario no encontrado', 'NOT_FOUND_ERROR', 'NOT_FOUND');
      }
      return {
        user: {
          id: user._id.toString(),
          firebase_uid: user.firebase_uid,
          name: user.name,
          email: user.email,
          plan: user.plan,
          plan_expires_at: user.plan_expires_at,
          push_tokens: user.push_tokens,
          notifications_enabled: user.notifications_enabled,
        }
      }
    } catch (error: any) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw new ApplicationError(401, 'Token inválido o expirado', 'AUTH_INVALID_TOKEN', 'AUTHENTICATION');
    }
  });
