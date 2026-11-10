import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(10000),
  MONGODB_URI: z.string().url(),
  // Opcional hasta que haya colas: hoy nada usa Redis.
  REDIS_URI: z.string().url().optional(),
  FIREBASE_API_KEY: z.string().min(1, 'FIREBASE_API_KEY is required').optional(),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required').optional(),
  APPLE_SERVICE_ID: z.string().min(1, 'APPLE_SERVICE_ID is required').optional(),
  CORS_ORIGIN: z.string().default('*'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const ENV = result.data;
