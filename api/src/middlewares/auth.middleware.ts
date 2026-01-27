import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { User } from '../modules/users/users.model.js';
import { Role } from '../constants/roles.js';
import { Types } from 'mongoose';

interface JwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: Types.ObjectId;
        role: Role;
      };
    }
  }
}

export const authenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Token no proporcionado', 'NO_TOKEN');
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

      const user = await User.findById(decoded.sub);

      if (!user) {
        throw ApiError.unauthorized('Usuario no encontrado', 'USER_NOT_FOUND');
      }

      if (!user.isActive) {
        throw ApiError.unauthorized('Usuario desactivado', 'USER_INACTIVE');
      }

      req.user = {
        id: user._id as Types.ObjectId,
        role: user.role,
      };

      next();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw ApiError.unauthorized('Token expirado', 'TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw ApiError.unauthorized('Token inválido', 'INVALID_TOKEN');
      }
      throw error;
    }
  }
);

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw ApiError.unauthorized('No autenticado');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(
        'No tienes permisos para realizar esta acción',
        'INSUFFICIENT_PERMISSIONS'
      );
    }

    next();
  };
}
