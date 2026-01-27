import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  availabilitySchema,
  slotsQuerySchema,
  professionalIdParamSchema,
} from './availability.schema.js';
import {
  getAvailability,
  upsertAvailability,
  getAvailableSlots,
} from './availability.controller.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /availability/:professionalId - Obtener disponibilidad
router.get(
  '/:professionalId',
  authorize(...PERMISSIONS.availability.read),
  validate({ params: professionalIdParamSchema }),
  getAvailability
);

// PUT /availability/:professionalId - Crear/actualizar disponibilidad
router.put(
  '/:professionalId',
  authorize(...PERMISSIONS.availability.write),
  validate({
    params: professionalIdParamSchema,
    body: availabilitySchema,
  }),
  upsertAvailability
);

// GET /availability/:professionalId/slots - Obtener slots disponibles
router.get(
  '/:professionalId/slots',
  authorize(...PERMISSIONS.availability.read),
  validate({
    params: professionalIdParamSchema,
    query: slotsQuerySchema,
  }),
  getAvailableSlots
);

export default router;
