import { z } from 'zod';

export const createClientSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  dni: z
    .string()
    .min(5, 'El DNI debe tener al menos 5 caracteres')
    .max(20, 'El DNI no puede exceder 20 caracteres')
    .trim(),
  phone: z
    .string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional(),
  email: z.string().email('Email inválido').optional(),
  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((v) => v === 'true')
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
