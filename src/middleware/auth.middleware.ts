import { Elysia } from 'elysia';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { AppError } from '../shared/AppError.js';
import { User } from '../models/User.js';

export interface IDecodedToken {
  userId: string;
  email: string;
  plan: string;
}

export const authMiddleware = new Elysia()
  .derive(async ({ headers }) => {
    const authHeader = headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No autorizado: Token faltante o formato incorrecto', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('No autorizado: Token vacío', 401, 'UNAUTHORIZED');
    }

    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as IDecodedToken;
      
      const user = await User.findById(decoded.userId).lean();
      if (!user) {
        throw new AppError('Usuario no encontrado', 404, 'USER_NOT_FOUND');
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
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Token inválido o expirado', 401, 'INVALID_TOKEN');
    }
  });
