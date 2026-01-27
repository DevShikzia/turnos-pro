import { Types } from 'mongoose';

/**
 * Resultado paginado genérico para listados
 */
export interface PaginatedResult<T = unknown> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Contexto de auditoría para registrar acciones
 */
export interface AuditContext {
  actorId: Types.ObjectId;
  ip?: string;
  userAgent?: string;
  requestId?: string;
}

/**
 * Query params base para paginación
 */
export interface BasePaginationQuery {
  page: number;
  limit: number;
}

/**
 * Parámetro ID común para rutas
 */
export interface IdParam {
  id: string;
}
