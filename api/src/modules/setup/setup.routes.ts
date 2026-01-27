import { Router } from 'express';
import { createAdmin } from './setup.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createAdminSchema } from './setup.schema.js';
import { setupLimiter } from '../../middlewares/rate-limit.middleware.js';

const router = Router();

router.post(
  '/admin',
  setupLimiter,
  validate({ body: createAdminSchema }),
  createAdmin
);

export { router as setupRoutes };
