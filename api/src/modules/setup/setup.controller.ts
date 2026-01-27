import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../../utils/async-handler.js';
import { ApiError } from '../../utils/api-error.js';
import { env } from '../../config/env.js';
import { User } from '../users/users.model.js';
import { ROLES } from '../../constants/roles.js';
import { auditService } from '../audit/audit.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../constants/audit-actions.js';
import { CreateAdminInput } from './setup.types.js';

export const createAdmin = asyncHandler(async (req: Request, res: Response) => {
  // Verificar si el endpoint de setup está habilitado
  if (!env.SETUP_ENABLED) {
    throw ApiError.forbidden(
      'El endpoint de setup está deshabilitado. Configura SETUP_ENABLED=true para habilitarlo.',
      'SETUP_DISABLED'
    );
  }

  // Verificar setup token
  const setupToken = req.headers['x-setup-token'] as string;
  
  if (!env.SETUP_TOKEN || !setupToken || setupToken !== env.SETUP_TOKEN) {
    throw ApiError.unauthorized('Token de setup inválido o no proporcionado', 'INVALID_SETUP_TOKEN');
  }

  // Verificar que no exista ningún admin
  const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
  
  if (existingAdmin) {
    throw ApiError.forbidden(
      'Ya existe un administrador en el sistema. Este endpoint solo funciona una vez.',
      'ADMIN_EXISTS'
    );
  }

  const { email, password } = req.body as CreateAdminInput;

  // Crear el admin
  const admin = await User.create({
    email,
    passwordHash: password, // Se hashea en el pre-save hook
    role: ROLES.ADMIN,
    isActive: true,
  });

  // Registrar en audit log
  await auditService.create({
    actorId: admin._id as Types.ObjectId,
    action: AUDIT_ACTIONS.ADMIN_BOOTSTRAPPED,
    entity: AUDIT_ENTITIES.USER,
    entityId: admin._id as Types.ObjectId,
    after: { email: admin.email, role: admin.role },
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
  });

  res.status(201).json({
    data: {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
    meta: {
      message: 'Administrador creado exitosamente. Este endpoint ya no funcionará.',
    },
  });
});
