import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().url(),
  REDIS_URI: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('*'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Environment validation failed:', JSON.stringify(result.error.format(), null, 2));
  process.exit(1);
}

export const ENV = result.data;
