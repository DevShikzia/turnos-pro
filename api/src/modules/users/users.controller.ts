import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { usersService } from './users.service.js';
import {
  CreateUserInput,
  UpdateUserInput,
  UserQueryInput,
} from './users.types.js';

const getAuditContext = (req: Request) => ({
  actorId: req.user!.id,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  requestId: req.requestId,
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as CreateUserInput;
  const user = await usersService.create(input, getAuditContext(req));

  res.status(201).json({
    data: {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
});

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as UserQueryInput;
  const result = await usersService.findAll(query);

  res.json(result);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.findById(req.params['id'] as string);

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

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const input = req.body as UpdateUserInput;
  const user = await usersService.update(
    req.params['id'] as string,
    input,
    getAuditContext(req)
  );

  res.json({
    data: {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.delete(req.params['id'] as string, getAuditContext(req));

  res.json({
    data: {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    },
    meta: { message: 'Usuario desactivado correctamente' },
  });
});
