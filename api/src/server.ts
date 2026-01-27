import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initializeSocketIO } from './modules/queue/queue.socket.js';
import { startQueueCron } from './modules/queue/queue.cron.js';

async function main(): Promise<void> {
  try {
    // Conectar a MongoDB
    await connectDB();

    // Crear app
    const app = createApp();

    // Iniciar servidor HTTP
    const httpServer = app.listen(env.PORT, () => {
      logger.info(
        {
          port: env.PORT,
          env: env.NODE_ENV,
        },
        `🚀 Servidor iniciado en http://localhost:${env.PORT}`
      );
    });

    // Inicializar Socket.io
    initializeSocketIO(httpServer);
    logger.info('Socket.io inicializado');

    // Iniciar cron jobs
    startQueueCron();
    logger.info('Cron jobs de queue iniciados');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} recibido. Cerrando servidor...`);

      httpServer.close(() => {
        logger.info('Servidor HTTP cerrado');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        logger.error('Forzando cierre del servidor');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Manejar errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled Rejection');
    });

    process.on('uncaughtException', (error) => {
      logger.fatal({ err: error }, 'Uncaught Exception');
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ err: error }, 'Error al iniciar el servidor');
    process.exit(1);
  }
}

main();
