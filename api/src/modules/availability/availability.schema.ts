import { z } from 'zod';

// Schema para un slot de tiempo
const timeSlotSchema = z.object({
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'La hora de inicio debe ser anterior a la hora de fin' }
);

// Schema para el horario semanal
const weeklyScheduleSchema = z.object({
  weekday: z
    .number()
    .min(1, 'Día de semana inválido (1-7)')
    .max(7, 'Día de semana inválido (1-7)'),
  slots: z.array(timeSlotSchema).default([]),
});

// Schema para excepciones
const exceptionSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  isAvailable: z.boolean(),
  slots: z.array(timeSlotSchema).optional(),
});

// Schema principal de disponibilidad
export const availabilitySchema = z.object({
  serviceId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'ID de servicio inválido'),
  timezone: z
    .string()
    .min(1, 'La zona horaria es requerida')
    .default('America/Argentina/Buenos_Aires'),
  weekly: z.array(weeklyScheduleSchema).default([]),
  exceptions: z.array(exceptionSchema).default([]),
  bufferMin: z
    .number()
    .min(0, 'El buffer no puede ser negativo')
    .max(60, 'El buffer máximo es 60 minutos')
    .default(0),
  durationMin: z
    .number()
    .min(5, 'La duración mínima es 5 minutos')
    .max(480, 'La duración máxima es 480 minutos')
    .default(30),
  price: z.number().min(0, 'El precio no puede ser negativo').optional(),
});

// Schema para query de slots
export const slotsQuerySchema = z.object({
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  serviceId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'ID de servicio inválido')
    .optional(),
});

export const professionalIdParamSchema = z.object({
  professionalId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de profesional inválido'),
});
