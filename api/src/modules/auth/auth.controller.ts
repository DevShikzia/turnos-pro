import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../../utils/async-handler.js';
import { authService } from './auth.service.js';
import { auditService } from '../audit/audit.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../constants/audit-actions.js';
import { LoginInput } from './auth.types.js';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const result = await authService.login(email, password);

  // Audit log del login exitoso
  await auditService.create({
    actorId: new Types.ObjectId(result.user.id),
    action: AUDIT_ACTIONS.USER_LOGIN,
    entity: AUDIT_ENTITIES.USER,
    entityId: new Types.ObjectId(result.user.id),
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
  });

  res.json({
    data: result,
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);

  res.json({
    data: {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    },
  });
});
