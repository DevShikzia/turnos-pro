import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { requestIdMiddleware } from './middlewares/request-id.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { generalLimiter } from './middlewares/rate-limit.middleware.js';

// Routes
import { setupRoutes } from './modules/setup/setup.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { clientsRoutes } from './modules/clients/clients.routes.js';
import { servicesRoutes } from './modules/services/services.routes.js';
import { professionalsRoutes } from './modules/professionals/professionals.routes.js';
import { appointmentsRoutes } from './modules/appointments/appointments.routes.js';
import availabilityRoutes from './modules/availability/availability.routes.js';
import { holidaysRoutes } from './modules/holidays/holidays.routes.js';
import queueRoutes from './modules/queue/queue.routes.js';

export function createApp(): Application {
  const app = express();

  // Security middlewares
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Si no hay origin (ej: Postman, mobile apps), permitir
        if (!origin) {
          callback(null, true);
          return;
        }
        
        // Parsear múltiples orígenes separados por coma
        const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
        
        // Permitir orígenes configurados
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        
        // Permitir localhost para desarrollo
        if (env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
          callback(null, true);
          return;
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    })
  );

  // Request ID middleware (debe ir antes del logger)
  app.use(requestIdMiddleware);

  // HTTP Logger
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({
        requestId: req.requestId,
      }),
      customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode}`;
      },
      customErrorMessage: (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode}`;
      },
    })
  );

  // Body parsers
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Rate limiting (general)
  app.use(generalLimiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API Routes
  app.use('/setup', setupRoutes);
  app.use('/auth', authRoutes);
  app.use('/users', usersRoutes);
  app.use('/clients', clientsRoutes);
  app.use('/services', servicesRoutes);
  app.use('/professionals', professionalsRoutes);
  app.use('/appointments', appointmentsRoutes);
  app.use('/availability', availabilityRoutes);
  app.use('/holidays', holidaysRoutes);
  app.use('/queue', queueRoutes);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Ruta no encontrada',
      },
    });
  });

  // Error handler (debe ser el último middleware)
  app.use(errorMiddleware);

  return app;
}
