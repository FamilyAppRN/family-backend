import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().url(),
  REDIS_URI: z.string().url(),
  FIREBASE_API_KEY: z.string().min(1, 'FIREBASE_API_KEY is required'),
  CORS_ORIGIN: z.string().default('*'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const ENV = result.data;
