import { Document, Types } from 'mongoose';
import { z } from 'zod';
import { AppointmentStatus } from '../../constants/appointment-status.js';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
  appointmentQuerySchema,
} from './appointments.schema.js';

// ============================================
// Entity Interfaces
// ============================================

/**
 * Interfaz base del turno (sin métodos de Mongoose)
 */
export interface IAppointment {
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  clientId: Types.ObjectId;
  professionalId: Types.ObjectId;
  serviceId: Types.ObjectId;
  createdBy: Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Documento de Mongoose para Appointment
 */
export interface IAppointmentDocument extends IAppointment, Document {}

// ============================================
// Input Types (inferidos de Zod schemas)
// ============================================

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;
