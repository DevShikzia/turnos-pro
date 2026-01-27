import { Document, Types } from 'mongoose';
import { AuditAction, AuditEntity } from '../../constants/audit-actions.js';

// ============================================
// Entity Interfaces
// ============================================

/**
 * Interfaz base del audit log (sin métodos de Mongoose)
 */
export interface IAuditLog {
  actorId: Types.ObjectId;
  action: AuditAction;
  entity: AuditEntity;
  entityId: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  createdAt: Date;
}

/**
 * Documento de Mongoose para AuditLog
 */
export interface IAuditLogDocument extends IAuditLog, Document {}

// ============================================
// Service Types
// ============================================

export interface CreateAuditLogParams {
  actorId: Types.ObjectId;
  action: AuditAction;
  entity: AuditEntity;
  entityId: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}
