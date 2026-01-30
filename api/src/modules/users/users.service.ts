import { Types, FilterQuery } from 'mongoose';
import { User } from './users.model.js';
import {
  IUserDocument,
  CreateUserInput,
  UpdateUserInput,
  UserQueryInput,
} from './users.types.js';
import { PaginatedResult, AuditContext } from '../../types/common.types.js';
import { ApiError } from '../../utils/api-error.js';
import { auditService } from '../audit/audit.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../constants/audit-actions.js';
import { Role } from '../../constants/roles.js';
import { env } from '../../config/env.js';

class UsersService {
  async create(
    input: CreateUserInput,
    context: AuditContext
  ): Promise<IUserDocument> {
    if (env.DEMO_MODE) {
      throw ApiError.forbidden(
        'Modo demo: no se pueden crear más usuarios. Solo está disponible el usuario de prueba.',
        'DEMO_MODE_RESTRICTION'
      );
    }

    // Verificar si ya existe un usuario con ese email
    const existing = await User.findOne({ email: input.email });
    if (existing) {
      throw ApiError.conflict('Ya existe un usuario con ese email', 'EMAIL_EXISTS');
    }

    const user = await User.create({
      email: input.email,
      passwordHash: input.password,
      role: input.role as Role,
      isActive: true,
    });

    await auditService.logCreate(
      context,
      AUDIT_ACTIONS.USER_CREATED,
      AUDIT_ENTITIES.USER,
      user._id as Types.ObjectId,
      { email: user.email, role: user.role, isActive: user.isActive }
    );

    return user;
  }

  async findAll(query: UserQueryInput): Promise<PaginatedResult> {
    const { search, role, isActive, page, limit } = query;

    const filter: FilterQuery<IUserDocument> = {};

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<IUserDocument> {
    const user = await User.findById(id);

    if (!user) {
      throw ApiError.notFound('Usuario no encontrado');
    }

    return user;
  }

  async update(
    id: string,
    input: UpdateUserInput,
    context: AuditContext
  ): Promise<IUserDocument> {
    const user = await this.findById(id);
    const before = { email: user.email, role: user.role, isActive: user.isActive };

    if (input.email && input.email !== user.email) {
      const existing = await User.findOne({ email: input.email });
      if (existing) {
        throw ApiError.conflict('Ya existe un usuario con ese email', 'EMAIL_EXISTS');
      }
      user.email = input.email;
    }

    if (input.password) {
      user.passwordHash = input.password;
    }

    if (typeof input.isActive === 'boolean') {
      user.isActive = input.isActive;
    }

    await user.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.USER_UPDATED,
      AUDIT_ENTITIES.USER,
      user._id as Types.ObjectId,
      before,
      { email: user.email, role: user.role, isActive: user.isActive }
    );

    return user;
  }

  async delete(id: string, context: AuditContext): Promise<IUserDocument> {
    const user = await this.findById(id);
    const before = { email: user.email, role: user.role, isActive: user.isActive };

    // Soft delete
    user.isActive = false;
    await user.save();

    await auditService.logDelete(
      context,
      AUDIT_ACTIONS.USER_DELETED,
      AUDIT_ENTITIES.USER,
      user._id as Types.ObjectId,
      before
    );

    return user;
  }
}

export const usersService = new UsersService();
