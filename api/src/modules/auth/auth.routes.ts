import { Router } from 'express';
import { login, me } from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { loginSchema } from './auth.schema.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rate-limit.middleware.js';

const router = Router();

router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.get('/me', authenticate, me);

export { router as authRoutes };
