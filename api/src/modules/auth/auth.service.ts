import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../../config/env.js';
import { User } from '../users/users.model.js';
import { IUserDocument } from '../users/users.types.js';
import { AuthResult, TokenPayload } from './auth.types.js';
import { ApiError } from '../../utils/api-error.js';

class AuthService {
  async login(email: string, password: string): Promise<AuthResult> {
    const user = await User.findByEmail(email);

    if (!user) {
      throw ApiError.unauthorized('Credenciales inválidas', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Usuario desactivado', 'USER_INACTIVE');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Credenciales inválidas', 'INVALID_CREDENTIALS');
    }

    // Actualizar último login
    user.lastLoginAt = new Date();
    await user.save();

    const token = this.generateToken(user);

    return {
      user: {
        id: (user._id as Types.ObjectId).toString(),
        email: user.email,
        role: user.role,
      },
      token,
    };
  }

  async getMe(userId: Types.ObjectId): Promise<IUserDocument> {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound('Usuario no encontrado');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Usuario desactivado', 'USER_INACTIVE');
    }

    return user;
  }

  private generateToken(user: IUserDocument): string {
    const payload: TokenPayload = {
      sub: (user._id as Types.ObjectId).toString(),
      role: user.role,
    };

    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as string,
    } as jwt.SignOptions);
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch {
      throw ApiError.unauthorized('Token inválido', 'INVALID_TOKEN');
    }
  }
}

export const authService = new AuthService();
