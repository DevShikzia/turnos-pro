import { Router } from 'express';
import {
  createProfessional,
  getProfessionals,
  getProfessionalById,
  updateProfessional,
  deleteProfessional,
} from './professionals.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createProfessionalSchema,
  updateProfessionalSchema,
  professionalQuerySchema,
  idParamSchema,
} from './professionals.schema.js';
import { authenticate } from '../../middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

router.post('/', validate({ body: createProfessionalSchema }), createProfessional);

router.get('/', validate({ query: professionalQuerySchema }), getProfessionals);

router.get('/:id', validate({ params: idParamSchema }), getProfessionalById);

router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateProfessionalSchema }),
  updateProfessional
);

router.delete('/:id', validate({ params: idParamSchema }), deleteProfessional);

export { router as professionalsRoutes };
