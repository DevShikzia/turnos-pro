import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'La contraseña es requerida'),
});
