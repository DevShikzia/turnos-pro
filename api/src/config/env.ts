import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  // Setup endpoint - puede deshabilitarse en producción
  SETUP_ENABLED: z.string().transform((v) => v === 'true').default('true'),
  SETUP_TOKEN: z.string().min(16, 'SETUP_TOKEN must be at least 16 characters').optional(),
  CORS_ORIGIN: z.string().default('http://localhost:4200,http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  // Modo demo: solo usuario y cliente de prueba, no se crean nuevos
  DEMO_MODE: z.string().transform((v) => v === 'true').default('false'),
  DEMO_USER_ID: z.string().optional(), // ID del usuario recepcionista de prueba
  DEMO_CLIENT_ID: z.string().optional(), // ID del cliente de prueba
  // Kiosk: clave opcional para validar peticiones de /queue/kiosk/* (header X-Kiosk-Key)
  KIOSK_API_KEY: z.string().optional().transform((v) => (v && v.length > 0 ? v : undefined)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
export const isDemoMode = env.DEMO_MODE === true;
