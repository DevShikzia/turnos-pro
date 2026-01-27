import { z } from 'zod';
import { Role } from '../../constants/roles.js';
import { loginSchema } from './auth.schema.js';

// ============================================
// Input Types (inferidos de Zod schemas)
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// Auth Response Types
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
