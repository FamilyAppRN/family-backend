import { t } from 'elysia';
import { PASSWORD_REGEX } from '../../../../shared/domain/constants.js';

export const registerRequestSchema = t.Object({
  email: t.String({ format: 'email', error: 'Email inválido' }),
  password: t.String({ 
    minLength: 8, 
    pattern: PASSWORD_REGEX,
    error: 'La contraseña debe tener al menos 8 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales (@$!%*?&)' 
  }),
  name: t.String({ minLength: 2, error: 'El nombre es muy corto' }),
});

export const loginRequestSchema = t.Object({
  email: t.String({ format: 'email', error: 'Email inválido' }),
  password: t.String({ minLength: 1, error: 'La contraseña es requerida' }),
});

export const refreshTokenRequestSchema = t.Object({
  refreshToken: t.String({ minLength: 1, error: 'El refresh token es requerido' }),
});

export const pushTokenRequestSchema = t.Object({
  token: t.String({ minLength: 1, error: 'El token es requerido' }),
});

// Output Schemas para sanitización (Value.Clean)

export const userResponseSchema = t.Object({
  id: t.String(),
  email: t.String(),
  name: t.String(),
  plan: t.String(),
  plan_expires_at: t.Optional(t.Any()),
  notifications_enabled: t.Boolean(),
  created_at: t.Any(),
  updated_at: t.Any(),
});

export const authResponseSchema = t.Object({
  user: userResponseSchema,
  accessToken: t.String(),
  refreshToken: t.String(),
});

export const tokenResponseSchema = t.Object({
  accessToken: t.String(),
});
