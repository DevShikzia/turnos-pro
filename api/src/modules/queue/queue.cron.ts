import cron from 'node-cron';
import { logger } from '../../utils/logger.js';
import { queueService } from './queue.service.js';
import { CronLock } from './queue.cron-lock.js';
import { appointmentsService } from '../appointments/appointments.service.js';
import { env } from '../../config/env.js';

const cronLock = new CronLock();

/**
 * Inicia los cron jobs de queue
 */
export function startQueueCron(): void {
  // En modo demo: limpieza cada 10 min solo de TURNOS demo (la fila se mantiene persistente)
  if (env.DEMO_MODE) {
    cron.schedule('*/10 * * * *', async () => {
      const lockKey = 'queue:cleanup:demo:10min';
      try {
        const acquired = await cronLock.acquireLock(lockKey, 600); // 10 min TTL
        if (!acquired) return;

        const deletedAppointments = await appointmentsService.cleanupDemoAppointments();
        logger.info({ deletedAppointments }, 'Limpieza demo cada 10 min: turnos eliminados (fila persistente)');
        await cronLock.releaseLock(lockKey);
      } catch (error) {
        logger.error({ err: error }, 'Error en cron limpieza demo 10 min');
        await cronLock.releaseLock(lockKey).catch(() => {});
      }
    });
    logger.info('Cron limpieza demo cada 10 min configurado (solo turnos, fila persistente)');
  }

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
