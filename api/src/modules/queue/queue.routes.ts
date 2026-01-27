import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import rateLimit from 'express-rate-limit';
import {
  createTicketSchema,
  callTicketSchema,
  assignDeskSchema,
  ticketQuerySchema,
  ticketIdParamSchema,
  ticketCodeParamSchema,
} from './queue.schema.js';
import {
  createTicketFromKiosk,
  getTicketStatusByCode,
  getTickets,
  getTicketById,
  callTicket,
  serveTicket,
  doneTicket,
  cancelTicket,
  assignDesk,
  getDesks,
} from './queue.controller.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = Router();

// ============================================
// Rutas públicas (Kiosco)
// ============================================

// Rate limit fuerte para kiosco (anti abuso)
const kioskRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // 10 requests por minuto
  message: {
    error: {
      code: 'KIOSK_RATE_LIMIT_EXCEEDED',
      message: 'Demasiadas solicitudes desde el kiosco',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /queue/kiosk/ticket - Generar ticket (público, con rate limit)
router.post(
  '/kiosk/ticket',
  kioskRateLimit,
  validate({ body: createTicketSchema }),
  createTicketFromKiosk
);

// GET /queue/kiosk/status/:code - Estado de ticket (público)
router.get(
  '/kiosk/status/:code',
  validate({ params: ticketCodeParamSchema }),
  getTicketStatusByCode
);

// ============================================
// Rutas privadas (requieren autenticación)
// ============================================

router.use(authenticate);

// GET /queue/tickets - Lista de tickets
router.get(
  '/tickets',
  authorize(...PERMISSIONS.queue.read),
  validate({ query: ticketQuerySchema }),
  getTickets
);

// GET /queue/tickets/:id - Obtener ticket por ID
router.get(
  '/tickets/:id',
  authorize(...PERMISSIONS.queue.read),
  validate({ params: ticketIdParamSchema }),
  getTicketById
);

// POST /queue/tickets/:id/call - Llamar ticket
router.post(
  '/tickets/:id/call',
  authorize(...PERMISSIONS.queue.call),
  validate({
    params: ticketIdParamSchema,
    body: callTicketSchema,
  }),
  callTicket
);

// POST /queue/tickets/:id/serve - Marcar en servicio
router.post(
  '/tickets/:id/serve',
  authorize(...PERMISSIONS.queue.serve),
  validate({ params: ticketIdParamSchema }),
  serveTicket
);

// POST /queue/tickets/:id/done - Marcar completado
router.post(
  '/tickets/:id/done',
  authorize(...PERMISSIONS.queue.done),
  validate({ params: ticketIdParamSchema }),
  doneTicket
);

// POST /queue/tickets/:id/cancel - Cancelar ticket
router.post(
  '/tickets/:id/cancel',
  authorize(...PERMISSIONS.queue.cancel),
  validate({ params: ticketIdParamSchema }),
  cancelTicket
);

// PUT /queue/desks/assign - Asignar ventanilla
router.put(
  '/desks/assign',
  authorize(...PERMISSIONS.queue.assignDesk),
  validate({ body: assignDeskSchema }),
  assignDesk
);

// GET /queue/desks - Obtener ventanillas
router.get(
  '/desks',
  authorize(...PERMISSIONS.queue.read),
  getDesks
);

export default router;
