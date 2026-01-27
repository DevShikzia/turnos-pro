import { Document, Types } from 'mongoose';
import { z } from 'zod';
import { availabilitySchema, slotsQuerySchema } from './availability.schema.js';

// ============================================
// Slot Interfaces
// ============================================

export interface ITimeSlot {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

export interface IWeeklySchedule {
  weekday: number; // 1-7 (ISO: 1=Lunes, 7=Domingo)
  slots: ITimeSlot[];
}

export interface IException {
  date: string; // "YYYY-MM-DD"
  isAvailable: boolean;
  slots?: ITimeSlot[];
}

// ============================================
// Entity Interfaces
// ============================================

export interface IAvailability {
  professionalId: Types.ObjectId;
  serviceId: Types.ObjectId;
  timezone: string;
  weekly: IWeeklySchedule[];
  exceptions: IException[];
  bufferMin: number;
  durationMin: number; // Duración por defecto de los turnos
  price?: number; // Precio por defecto de los turnos
  createdAt: Date;
  updatedAt: Date;
}

export interface IAvailabilityDocument extends IAvailability, Document {}

// ============================================
// Input Types
// ============================================

export type AvailabilityInput = z.infer<typeof availabilitySchema>;
export type SlotsQueryInput = z.infer<typeof slotsQuerySchema>;

// ============================================
// Response Types
// ============================================

export interface IAvailableSlot {
  startTime: string; // ISO datetime
  endTime: string; // ISO datetime
  available: boolean;
}

export interface IAvailableSlotsResponse {
  professionalId: string;
  timezone: string;
  slots: IAvailableSlot[];
}
