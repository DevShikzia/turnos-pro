import { Document } from 'mongoose';
import { z } from 'zod';
import {
  createClientSchema,
  updateClientSchema,
  clientQuerySchema,
} from './clients.schema.js';

// ============================================
// Entity Interfaces
// ============================================

/**
 * Interfaz base del cliente (sin métodos de Mongoose)
 */
export interface IClient {
  fullName: string;
  dni: string;
  phone?: string;
  email?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Documento de Mongoose para Client
 */
export interface IClientDocument extends IClient, Document {}

// ============================================
// Input Types (inferidos de Zod schemas)
// ============================================

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQueryInput = z.infer<typeof clientQuerySchema>;
