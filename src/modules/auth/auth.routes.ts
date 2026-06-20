import { Elysia, t } from 'elysia';
import { AuthController } from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  pushTokenSchema,
} from './auth.schema.js';

export const authRoutes = new Elysia()
  // Unauthenticated routes
  .group('/auth', (app) =>
    app
      .post('/register', AuthController.register, {
        body: registerSchema,
      })
      .post('/login', AuthController.login, {
        body: loginSchema,
      })
      .post('/refresh', AuthController.refresh, {
        body: refreshTokenSchema,
      })
  )
  // Authenticated routes
  .group('', (app) =>
    app
      .use(authMiddleware)
      .post('/auth/logout', AuthController.logout)
      .patch('/users/me/push-token', AuthController.updatePushToken, {
        body: pushTokenSchema,
      })
      .delete('/users/me/push-token', AuthController.deletePushToken, {
        body: t.Object({ token: t.String() }),
      })
  );
