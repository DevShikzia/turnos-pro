import { Types, FilterQuery } from 'mongoose';
import { Service } from './services.model.js';
import {
  IServiceDocument,
  CreateServiceInput,
  UpdateServiceInput,
  ServiceQueryInput,
} from './services.types.js';
import { PaginatedResult, AuditContext } from '../../types/common.types.js';
import { ApiError } from '../../utils/api-error.js';
import { auditService } from '../audit/audit.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../constants/audit-actions.js';

class ServicesService {
  async create(
    input: CreateServiceInput,
    context: AuditContext
  ): Promise<IServiceDocument> {
    const service = await Service.create(input);

    await auditService.logCreate(
      context,
      AUDIT_ACTIONS.SERVICE_CREATED,
      AUDIT_ENTITIES.SERVICE,
      service._id as Types.ObjectId,
      service.toObject() as unknown as Record<string, unknown>
    );

    return service;
  }

  async findAll(query: ServiceQueryInput): Promise<PaginatedResult> {
    const { search, isActive, page, limit } = query;

    const filter: FilterQuery<IServiceDocument> = {};

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Service.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Service.countDocuments(filter),
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

  async findById(id: string): Promise<IServiceDocument> {
    const service = await Service.findById(id);

    if (!service) {
      throw ApiError.notFound('Servicio no encontrado');
    }

    return service;
  }

  async findActiveById(id: string): Promise<IServiceDocument> {
    const service = await Service.findOne({ _id: id, isActive: true });

    if (!service) {
      throw ApiError.notFound('Servicio no encontrado o inactivo');
    }

    return service;
  }

  async update(
    id: string,
    input: UpdateServiceInput,
    context: AuditContext
  ): Promise<IServiceDocument> {
    const service = await this.findById(id);
    const before = service.toObject();

    Object.assign(service, input);
    await service.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.SERVICE_UPDATED,
      AUDIT_ENTITIES.SERVICE,
      service._id as Types.ObjectId,
      before,
      service.toObject()
    );

    return service;
  }

  async delete(id: string, context: AuditContext): Promise<IServiceDocument> {
    const service = await this.findById(id);
    const before = service.toObject();

    // Soft delete
    service.isActive = false;
    await service.save();

    await auditService.logDelete(
      context,
      AUDIT_ACTIONS.SERVICE_DELETED,
      AUDIT_ENTITIES.SERVICE,
      service._id as Types.ObjectId,
      before
    );

    return service;
  }
}

export const servicesService = new ServicesService();
