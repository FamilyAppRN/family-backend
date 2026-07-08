import { Elysia } from 'elysia';
import { node } from '@elysiajs/node';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { ENV } from './config/env.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { authRoutes } from './modules/auth/infrastructure/http/auth.routes.js';
import { householdRoutes } from './modules/household/infrastructure/http/household.routes.js';
import { shoppingRoutes } from './modules/shopping/infrastructure/http/shopping.routes.js';
import { tasksRoutes } from './modules/tasks/infrastructure/http/tasks.routes.js';
import { notesRoutes } from './modules/notes/infrastructure/http/notes.routes.js';
import { ApiResponse } from './shared/infrastructure/http/responseFormatter.js';
import { ApplicationError } from './shared/domain/error.js';

export const app = new Elysia({ adapter: node() })
  // Enable Swagger/OpenAPI documentation at /docs
  .use(swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'Asistente Familiar Collab API',
        version: '1.0.0',
        description: 'Documentación de la API para el backend de Asistente Familiar Collab',
      },
    },
  }))
  // Enable CORS
  .use(cors({
    origin: ENV.CORS_ORIGIN === '*' ? true : ENV.CORS_ORIGIN,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true,
  }))
  // Enable global error handler
  .use(errorMiddleware)
  // Healthcheck endpoint
  .get('/', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'family-collab-backend'
  }))
  // Mount API endpoints
  .group('/api', (api) =>
    api
      .use(authRoutes)
      .use(householdRoutes)
      .use(shoppingRoutes)
      .use(tasksRoutes)
      .use(notesRoutes)
  );
export type App = typeof app;
