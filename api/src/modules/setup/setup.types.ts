import { z } from 'zod';
import { createAdminSchema } from './setup.schema.js';

// ============================================
// Input Types (inferidos de Zod schemas)
// ============================================

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
