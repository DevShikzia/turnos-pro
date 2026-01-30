import { Types, FilterQuery } from 'mongoose';
import { Professional } from './professionals.model.js';
import {
  IProfessionalDocument,
  CreateProfessionalInput,
  UpdateProfessionalInput,
  ProfessionalQueryInput,
} from './professionals.types.js';
import { PaginatedResult, AuditContext } from '../../types/common.types.js';
import { ApiError } from '../../utils/api-error.js';
import { auditService } from '../audit/audit.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../constants/audit-actions.js';
import { env } from '../../config/env.js';

class ProfessionalsService {
  async create(
    input: CreateProfessionalInput,
    context: AuditContext
  ): Promise<IProfessionalDocument> {
    if (env.DEMO_MODE) {
      throw ApiError.forbidden(
        'Modo demo: no se pueden crear profesionales.',
        'DEMO_MODE_RESTRICTION'
      );
    }
    const professional = await Professional.create({
      ...input,
      services: input.services.map((id) => new Types.ObjectId(id)),
    });

    await auditService.logCreate(
      context,
      AUDIT_ACTIONS.PROFESSIONAL_CREATED,
      AUDIT_ENTITIES.PROFESSIONAL,
      professional._id as Types.ObjectId,
      professional.toObject() as unknown as Record<string, unknown>
    );

    return professional;
  }

  async findAll(query: ProfessionalQueryInput): Promise<PaginatedResult> {
    const { search, isActive, serviceId, page, limit } = query;

    const filter: FilterQuery<IProfessionalDocument> = {};

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    if (search) {
      filter.fullName = { $regex: search, $options: 'i' };
    }

    if (serviceId) {
      filter.services = new Types.ObjectId(serviceId);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Professional.find(filter)
        .populate('services', 'name durationMin price')
        .sort({ fullName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Professional.countDocuments(filter),
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

  async findById(id: string): Promise<IProfessionalDocument> {
    const professional = await Professional.findById(id).populate(
      'services',
      'name durationMin price'
    );

    if (!professional) {
      throw ApiError.notFound('Profesional no encontrado');
    }

    return professional;
  }

  async findActiveById(id: string): Promise<IProfessionalDocument> {
    const professional = await Professional.findOne({ _id: id, isActive: true });

    if (!professional) {
      throw ApiError.notFound('Profesional no encontrado o inactivo');
    }

    return professional;
  }

  async update(
    id: string,
    input: UpdateProfessionalInput,
    context: AuditContext
  ): Promise<IProfessionalDocument> {
    if (env.DEMO_MODE) {
      throw ApiError.forbidden(
        'Modo demo: no se pueden editar profesionales.',
        'DEMO_MODE_RESTRICTION'
      );
    }
    const professional = await this.findById(id);
    const before = professional.toObject();

    if (input.services) {
      professional.services = input.services.map((sid) => new Types.ObjectId(sid));
    }
    if (input.fullName !== undefined) professional.fullName = input.fullName;
    if (input.email !== undefined) professional.email = input.email;
    if (input.phone !== undefined) professional.phone = input.phone;

    await professional.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.PROFESSIONAL_UPDATED,
      AUDIT_ENTITIES.PROFESSIONAL,
      professional._id as Types.ObjectId,
      before,
      professional.toObject()
    );

    return professional;
  }

  async delete(id: string, context: AuditContext): Promise<IProfessionalDocument> {
    if (env.DEMO_MODE) {
      throw ApiError.forbidden(
        'Modo demo: no se pueden desactivar profesionales.',
        'DEMO_MODE_RESTRICTION'
      );
    }
    const professional = await this.findById(id);
    const before = professional.toObject();

    // Soft delete
    professional.isActive = false;
    await professional.save();

    await auditService.logDelete(
      context,
      AUDIT_ACTIONS.PROFESSIONAL_DELETED,
      AUDIT_ENTITIES.PROFESSIONAL,
      professional._id as Types.ObjectId,
      before
    );

    return professional;
  }
}

export const professionalsService = new ProfessionalsService();
