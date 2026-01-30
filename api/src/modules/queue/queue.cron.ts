import cron from 'node-cron';
import { DateTime } from 'luxon';
import { logger } from '../../utils/logger.js';
import { queueService } from './queue.service.js';
import { CronLock } from './queue.cron-lock.js';

const cronLock = new CronLock();

/**
 * Inicia los cron jobs de queue
 */
export function startQueueCron(): void {
  // Limpieza diaria a las 00:00 (timezone local)
  cron.schedule('0 0 * * *', async () => {
    const lockKey = 'queue:cleanup:daily';
    
    try {
      // Intentar adquirir lock distribuido
      const acquired = await cronLock.acquireLock(lockKey, 3600); // 1 hora TTL
      
      if (!acquired) {
        logger.info('Cron de limpieza ya está ejecutándose en otra instancia');
        return;
      }

      logger.info('Iniciando limpieza diaria de queue...');

      // Limpiar tickets de modo demo (días anteriores)
      const deletedDemoTickets = await queueService.cleanupDemoTickets();
      logger.info({ deletedDemoTickets }, 'Tickets demo eliminados');

      // Limpiar tickets antiguos (> 7 días)
      const deletedTickets = await queueService.cleanupOldTickets(7);
      logger.info({ deletedTickets }, 'Tickets antiguos eliminados');

      // Desactivar desk assignments antiguos
      const deactivatedDesks = await queueService.cleanupOldDeskAssignments();
      logger.info({ deactivatedDesks }, 'Desk assignments desactivados');

      // Liberar lock
      await cronLock.releaseLock(lockKey);
      
      logger.info('Limpieza diaria de queue completada');
    } catch (error) {
      logger.error({ err: error }, 'Error en cron de limpieza diaria');
      // Intentar liberar lock en caso de error
      await cronLock.releaseLock(lockKey).catch(() => {});
    }
  }, {
    timezone: 'America/Argentina/Buenos_Aires',
  });

  logger.info('Cron jobs de queue configurados');
}
