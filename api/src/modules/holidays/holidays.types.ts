import { Document } from 'mongoose';
import { z } from 'zod';
import { createHolidaySchema, updateHolidaySchema, holidayQuerySchema } from './holidays.schema.js';

/**
 * Interfaz base del feriado/día no laborable
 */
export interface IHoliday {
  date: string; // Formato YYYY-MM-DD
  name: string;
  description?: string;
  isRecurring: boolean; // Si se repite cada año (solo día/mes)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Documento de Mongoose para Holiday
 */
export interface IHolidayDocument extends IHoliday, Document {}

// ============================================
// Input Types (inferidos de Zod schemas)
// ============================================

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
export type UpdateHolidayInput = z.infer<typeof updateHolidaySchema>;
export type HolidayQueryInput = z.infer<typeof holidayQuerySchema>;
