import { Document, Types } from 'mongoose';
import { z } from 'zod';
import {
  createProfessionalSchema,
  updateProfessionalSchema,
  professionalQuerySchema,
} from './professionals.schema.js';

// ============================================
// Entity Interfaces
// ============================================

/**
 * Interfaz base del profesional (sin métodos de Mongoose)
 */
export interface IProfessional {
  fullName: string;
  email?: string;
  phone?: string;
  services: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Documento de Mongoose para Professional
 */
export interface IProfessionalDocument extends IProfessional, Document {}

// ============================================
// Input Types (inferidos de Zod schemas)
// ============================================

export type CreateProfessionalInput = z.infer<typeof createProfessionalSchema>;
export type UpdateProfessionalInput = z.infer<typeof updateProfessionalSchema>;
export type ProfessionalQueryInput = z.infer<typeof professionalQuerySchema>;
