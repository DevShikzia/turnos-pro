import { Router } from 'express';
import {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
} from './services.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceQuerySchema,
  idParamSchema,
} from './services.schema.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.post(
  '/',
  authorize(...PERMISSIONS.services.create),
  validate({ body: createServiceSchema }),
  createService
);

router.get(
  '/',
  authorize(...PERMISSIONS.services.read),
  validate({ query: serviceQuerySchema }),
  getServices
);

router.get(
  '/:id',
  authorize(...PERMISSIONS.services.read),
  validate({ params: idParamSchema }),
  getServiceById
);

router.patch(
  '/:id',
  authorize(...PERMISSIONS.services.update),
  validate({ params: idParamSchema, body: updateServiceSchema }),
  updateService
);

router.delete(
  '/:id',
  authorize(...PERMISSIONS.services.delete),
  validate({ params: idParamSchema }),
  deleteService
);

export { router as servicesRoutes };
