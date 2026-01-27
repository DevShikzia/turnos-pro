import { z } from 'zod';
import { ALL_APPOINTMENT_STATUSES } from '../../constants/appointment-status.js';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createAppointmentSchema = z.object({
  startAt: z
    .string()
    .datetime({ message: 'Fecha de inicio inválida (formato ISO 8601)' })
    .transform((v) => new Date(v)),
  clientId: z.string().regex(objectIdRegex, 'ID de cliente inválido'),
  professionalId: z.string().regex(objectIdRegex, 'ID de profesional inválido'),
  serviceId: z.string().regex(objectIdRegex, 'ID de servicio inválido'),
  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional(),
});

export const updateAppointmentSchema = z.object({
  startAt: z
    .string()
    .datetime({ message: 'Fecha de inicio inválida (formato ISO 8601)' })
    .transform((v) => new Date(v))
    .optional(),
  clientId: z.string().regex(objectIdRegex, 'ID de cliente inválido').optional(),
  professionalId: z.string().regex(objectIdRegex, 'ID de profesional inválido').optional(),
  serviceId: z.string().regex(objectIdRegex, 'ID de servicio inválido').optional(),
  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(ALL_APPOINTMENT_STATUSES as [string, ...string[]], {
    errorMap: () => ({ message: 'Estado inválido' }),
  }),
});

export const appointmentQuerySchema = z.object({
  professionalId: z.string().regex(objectIdRegex, 'ID de profesional inválido').optional(),
  clientId: z.string().regex(objectIdRegex, 'ID de cliente inválido').optional(),
  status: z.enum(ALL_APPOINTMENT_STATUSES as [string, ...string[]]).optional(),
  dateFrom: z
    .string()
    .datetime()
    .transform((v) => new Date(v))
    .optional(),
  dateTo: z
    .string()
    .datetime()
    .transform((v) => new Date(v))
    .optional(),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().positive())
    .default('1'),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().positive().max(100))
    .default('20'),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID inválido'),
});
