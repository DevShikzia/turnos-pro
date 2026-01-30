import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

/**
 * Si KIOSK_API_KEY está configurada, exige el header X-Kiosk-Key en las peticiones a /queue/kiosk/*.
 * Es una clave única para el kiosk (Astro): estática y permanente, no vence ni se renueva.
 * La misma clave se configura en la API (KIOSK_API_KEY) y en el kiosk (PUBLIC_KIOSK_API_KEY).
 */
export function kioskApiKeyMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const configuredKey = env.KIOSK_API_KEY;

  if (!configuredKey) {
    next();
    return;
  }

  const sentKey = req.headers['x-kiosk-key'] as string | undefined;

  if (!sentKey || sentKey !== configuredKey) {
    throw ApiError.unauthorized(
      'Clave de kiosco inválida o no proporcionada',
      'KIOSK_KEY_INVALID'
    );
  }

  next();
}
