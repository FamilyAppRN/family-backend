import { t } from 'elysia';

export const registerSchema = t.Object({
  name: t.String({ minLength: 2, error: 'Name must be at least 2 characters long' }),
  email: t.String({ format: 'email', error: 'Invalid email address' }),
  password: t.String({ minLength: 6, error: 'Password must be at least 6 characters long' }),
  avatar_url: t.Optional(t.Union([t.String(), t.Null()])),
});

export const loginSchema = t.Object({
  email: t.String({ format: 'email', error: 'Invalid email address' }),
  password: t.String({ minLength: 6 }),
});

export const refreshTokenSchema = t.Object({
  refreshToken: t.String(),
});

export const pushTokenSchema = t.Object({
  token: t.String(),
  device_label: t.String(),
});
