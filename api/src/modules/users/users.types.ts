import { Document, Model } from 'mongoose';
import { z } from 'zod';
import { Role } from '../../constants/roles.js';
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
} from './users.schema.js';

// ============================================
// Entity Interfaces
// ============================================

/**
 * Interfaz base del usuario (sin métodos de Mongoose)
 */
export interface IUser {
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Documento de Mongoose para User con métodos de instancia
 */
export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Modelo de Mongoose para User con métodos estáticos
 */
export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

// ============================================
// Input Types (inferidos de Zod schemas)
// ============================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;

// ============================================
// Auth Types
// ============================================

export interface AuthResult {
  user: {
    id: string;
    email: string;
    role: Role;
  };
  token: string;
}

export interface JwtPayload {
  sub: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface TokenPayload {
  sub: string;
  role: Role;
}
