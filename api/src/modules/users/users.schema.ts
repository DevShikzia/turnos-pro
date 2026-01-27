import { z } from 'zod';
import { ALL_ROLES } from '../../constants/roles.js';

export const createUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  role: z.enum(ALL_ROLES as [string, ...string[]], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }),
});

export const updateUserSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((v) => v.toLowerCase().trim())
    .optional(),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    )
    .optional(),
  isActive: z.boolean().optional(),
});

export const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(ALL_ROLES as [string, ...string[]]).optional(),
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
