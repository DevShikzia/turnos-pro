import { Types } from 'mongoose';
import { AuditLog } from './audit.model.js';
import { IAuditLog, CreateAuditLogParams } from './audit.types.js';
import { AuditAction, AuditEntity } from '../../constants/audit-actions.js';
import { AuditContext } from '../../types/common.types.js';
import { logger } from '../../utils/logger.js';

class AuditService {
  async create(params: CreateAuditLogParams): Promise<void> {
    try {
      await AuditLog.create(params);
      logger.debug(
        { action: params.action, entity: params.entity, entityId: params.entityId.toString() },
        'Audit log created'
      );
    } catch (error) {
      // No queremos que falle la operación principal si el audit log falla
      logger.error({ err: error, params }, 'Failed to create audit log');
    }
  }

  async logCreate(
    context: AuditContext,
    action: AuditAction,
    entity: AuditEntity,
    entityId: Types.ObjectId,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.create({
      ...context,
      action,
      entity,
      entityId,
      after: this.sanitizeData(data),
    });
  }

  async logUpdate(
    context: AuditContext,
    action: AuditAction,
    entity: AuditEntity,
    entityId: Types.ObjectId,
    before: Record<string, unknown>,
    after: Record<string, unknown>
  ): Promise<void> {
    await this.create({
      ...context,
      action,
      entity,
      entityId,
      before: this.sanitizeData(before),
      after: this.sanitizeData(after),
    });
  }

  async logDelete(
    context: AuditContext,
    action: AuditAction,
    entity: AuditEntity,
    entityId: Types.ObjectId,
    data: Record<string, unknown>
  ): Promise<void> {
    await this.create({
      ...context,
      action,
      entity,
      entityId,
      before: this.sanitizeData(data),
    });
  }

  async findByEntity(
    entity: AuditEntity,
    entityId: Types.ObjectId,
    limit = 50
  ): Promise<IAuditLog[]> {
    return AuditLog.find({ entity, entityId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('actorId', 'email role')
      .lean();
  }

  async findByActor(actorId: Types.ObjectId, limit = 50): Promise<IAuditLog[]> {
    return AuditLog.find({ actorId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async findRecent(limit = 100): Promise<IAuditLog[]> {
    return AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('actorId', 'email role')
      .lean();
  }

  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...data };
    // Remover campos sensibles
    const sensitiveFields = ['passwordHash', 'password', '__v'];
    for (const field of sensitiveFields) {
      delete sanitized[field];
    }
    return sanitized;
  }
}

export const auditService = new AuditService();
