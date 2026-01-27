import { z } from 'zod';

// Schema para crear ticket desde kiosco
export const createTicketSchema = z.object({
  dni: z
    .string()
    .min(7, 'El DNI debe tener al menos 7 caracteres')
    .max(20, 'El DNI no puede exceder 20 caracteres')
    .regex(/^\d+$/, 'El DNI solo puede contener números'),
  locationId: z
    .string()
    .min(1, 'El locationId es requerido')
    .default('main'),
});

// Schema para llamar ticket
export const callTicketSchema = z.object({
  deskId: z
    .string()
    .min(1, 'El deskId es requerido')
    .regex(/^VENT-\d+$/, 'Formato de deskId inválido (ej: VENT-5)'),
});

// Schema para asignar ventanilla
export const assignDeskSchema = z.object({
  locationId: z
    .string()
    .min(1, 'El locationId es requerido')
    .default('main'),
  deskId: z
    .string()
    .min(1, 'El deskId es requerido')
    .regex(/^VENT-\d+$/, 'Formato de deskId inválido (ej: VENT-5)'),
});

// Schema para query de tickets
export const ticketQuerySchema = z.object({
  dateKey: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
    .optional(),
  locationId: z.string().optional().default('main'),
  status: z
    .enum(['waiting', 'called', 'in_service', 'done', 'cancelled', 'no_show'])
    .optional(),
  type: z.enum(['T', 'C']).optional(),
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

// Schema para parámetros de ID
export const ticketIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ID de ticket inválido'),
});

// Schema para código de ticket (kiosco)
export const ticketCodeParamSchema = z.object({
  code: z.string().regex(/^[TC]\d+$/, 'Código de ticket inválido'),
});
