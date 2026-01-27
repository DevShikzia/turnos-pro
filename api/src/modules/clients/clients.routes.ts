import { Router } from 'express';
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from './clients.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
  idParamSchema,
} from './clients.schema.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { PERMISSIONS } from '../../constants/permissions.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.post(
  '/',
  authorize(...PERMISSIONS.clients.create),
  validate({ body: createClientSchema }),
  createClient
);

router.get(
  '/',
  authorize(...PERMISSIONS.clients.read),
  validate({ query: clientQuerySchema }),
  getClients
);

router.get(
  '/:id',
  authorize(...PERMISSIONS.clients.read),
  validate({ params: idParamSchema }),
  getClientById
);

router.patch(
  '/:id',
  authorize(...PERMISSIONS.clients.update),
  validate({ params: idParamSchema, body: updateClientSchema }),
  updateClient
);

router.delete(
  '/:id',
  authorize(...PERMISSIONS.clients.delete),
  validate({ params: idParamSchema }),
  deleteClient
);

export { router as clientsRoutes };
