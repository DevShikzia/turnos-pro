import { Types, FilterQuery } from 'mongoose';
import { Client } from './clients.model.js';
import {
  IClientDocument,
  CreateClientInput,
  UpdateClientInput,
  ClientQueryInput,
} from './clients.types.js';
import { PaginatedResult, AuditContext } from '../../types/common.types.js';
import { ApiError } from '../../utils/api-error.js';
import { auditService } from '../audit/audit.service.js';
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from '../../constants/audit-actions.js';

class ClientsService {
  async create(
    input: CreateClientInput,
    context: AuditContext
  ): Promise<IClientDocument> {
    const client = await Client.create(input);

    await auditService.logCreate(
      context,
      AUDIT_ACTIONS.CLIENT_CREATED,
      AUDIT_ENTITIES.CLIENT,
      client._id as Types.ObjectId,
      client.toObject() as unknown as Record<string, unknown>
    );

    return client;
  }

  async findAll(query: ClientQueryInput): Promise<PaginatedResult> {
    const { search, isActive, page, limit } = query;

    const filter: FilterQuery<IClientDocument> = {};

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Client.countDocuments(filter),
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

  async findById(id: string): Promise<IClientDocument> {
    const client = await Client.findById(id);

    if (!client) {
      throw ApiError.notFound('Cliente no encontrado');
    }

    return client;
  }

  async findActiveById(id: string): Promise<IClientDocument> {
    const client = await Client.findOne({ _id: id, isActive: true });

    if (!client) {
      throw ApiError.notFound('Cliente no encontrado o inactivo');
    }

    return client;
  }

  async findByDni(dni: string): Promise<IClientDocument> {
    const client = await Client.findOne({ dni, isActive: true });

    if (!client) {
      throw ApiError.notFound('Cliente no encontrado');
    }

    return client;
  }

  async update(
    id: string,
    input: UpdateClientInput,
    context: AuditContext
  ): Promise<IClientDocument> {
    const client = await this.findById(id);
    const before = client.toObject();

    Object.assign(client, input);
    await client.save();

    await auditService.logUpdate(
      context,
      AUDIT_ACTIONS.CLIENT_UPDATED,
      AUDIT_ENTITIES.CLIENT,
      client._id as Types.ObjectId,
      before,
      client.toObject()
    );

    return client;
  }

  async delete(id: string, context: AuditContext): Promise<IClientDocument> {
    const client = await this.findById(id);
    const before = client.toObject();

    // Soft delete
    client.isActive = false;
    await client.save();

    await auditService.logDelete(
      context,
      AUDIT_ACTIONS.CLIENT_DELETED,
      AUDIT_ENTITIES.CLIENT,
      client._id as Types.ObjectId,
      before
    );

    return client;
  }
}

export const clientsService = new ClientsService();
