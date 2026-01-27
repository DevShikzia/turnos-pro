import { Router } from 'express';
import {
  createHoliday,
  getHolidays,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
  getHolidaysInRange,
} from './holidays.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createHolidaySchema,
  updateHolidaySchema,
  holidayQuerySchema,
  idParamSchema,
} from './holidays.schema.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET endpoints - todos pueden ver los feriados
router.get('/', validate({ query: holidayQuerySchema }), getHolidays);
router.get('/range', getHolidaysInRange);
router.get('/:id', validate({ params: idParamSchema }), getHolidayById);

// Solo admin y staff pueden crear/editar/eliminar
router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.STAFF),
  validate({ body: createHolidaySchema }),
  createHoliday
);

router.patch(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.STAFF),
  validate({ params: idParamSchema, body: updateHolidaySchema }),
  updateHoliday
);

router.delete(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.STAFF),
  validate({ params: idParamSchema }),
  deleteHoliday
);

export { router as holidaysRoutes };
