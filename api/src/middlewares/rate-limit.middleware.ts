import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

// Rate limiter general
export const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes, por favor intenta más tarde',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter estricto para auth (login)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
  message: {
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de login, por favor intenta en 15 minutos',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
});

// Rate limiter para setup (muy estricto)
export const setupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 intentos por hora
  message: {
    error: {
      code: 'SETUP_RATE_LIMIT_EXCEEDED',
      message: 'Demasiados intentos de setup, por favor intenta en 1 hora',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
