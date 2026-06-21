import { Elysia } from 'elysia';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { ApplicationError } from '../shared/domain/error.js';
import { User } from '../models/User.js';

export interface IDecodedToken {
  userId: string;
  email: string;
  plan: string;
}

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
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as IDecodedToken;
      
      const user = await User.findById(decoded.userId).lean();
      if (!user) {
        throw new ApplicationError(404, 'Usuario no encontrado', 'NOT_FOUND_ERROR', 'NOT_FOUND');
      }
      return {
        user: {
          id: user._id.toString(),
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
