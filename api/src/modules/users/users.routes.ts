import { Router } from 'express';
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from './users.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  idParamSchema,
} from './users.schema.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { ROLES } from '../../constants/roles.js';

const router = Router();

// Todas las rutas requieren autenticación y rol admin
router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

router.post('/', validate({ body: createUserSchema }), createUser);

router.get('/', validate({ query: userQuerySchema }), getUsers);

router.get('/:id', validate({ params: idParamSchema }), getUserById);

router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateUserSchema }),
  updateUser
);

router.delete('/:id', validate({ params: idParamSchema }), deleteUser);

export { router as usersRoutes };
