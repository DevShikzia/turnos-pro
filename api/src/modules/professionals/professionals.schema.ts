import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createProfessionalSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .trim(),
  email: z.string().email('Email inválido').optional(),
  phone: z
    .string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional(),
  services: z
    .array(z.string().regex(objectIdRegex, 'ID de servicio inválido'))
    .default([]),
});

export const updateProfessionalSchema = createProfessionalSchema.partial();

export const professionalQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  serviceId: z.string().regex(objectIdRegex, 'ID de servicio inválido').optional(),
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
