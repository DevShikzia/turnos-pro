import { Router } from 'express';
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  cancelAppointment,
} from './appointments.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentQuerySchema,
  idParamSchema,
} from './appointments.schema.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.post(
  '/',
  authorize(...PERMISSIONS.appointments.create),
  validate({ body: createAppointmentSchema }),
  createAppointment
);

router.get(
  '/',
  authorize(...PERMISSIONS.appointments.read),
  validate({ query: appointmentQuerySchema }),
  getAppointments
);

router.get(
  '/:id',
  authorize(...PERMISSIONS.appointments.read),
  validate({ params: idParamSchema }),
  getAppointmentById
);

router.patch(
  '/:id',
  authorize(...PERMISSIONS.appointments.update),
  validate({ params: idParamSchema, body: updateAppointmentSchema }),
  updateAppointment
);

router.patch(
  '/:id/status',
  authorize(...PERMISSIONS.appointments.updateStatus),
  validate({ params: idParamSchema, body: updateAppointmentStatusSchema }),
  updateAppointmentStatus
);

router.delete(
  '/:id',
  authorize(...PERMISSIONS.appointments.delete),
  validate({ params: idParamSchema }),
  cancelAppointment
);

export { router as appointmentsRoutes };
