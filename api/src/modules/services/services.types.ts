import { Document } from 'mongoose';
import { z } from 'zod';
import {
  createServiceSchema,
  updateServiceSchema,
  serviceQuerySchema,
} from './services.schema.js';

// ============================================
// Entity Interfaces
// ============================================

/**
 * Interfaz base del servicio (sin métodos de Mongoose)
 */
export interface IService {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Documento de Mongoose para Service
 */
export interface IServiceDocument extends IService, Document {}

// ============================================
// Input Types (inferidos de Zod schemas)
// ============================================

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type ServiceQueryInput = z.infer<typeof serviceQuerySchema>;
