import { ROLES, Role } from './roles.js';

/**
 * Definición de permisos por recurso y acción
 * Indica qué roles pueden realizar cada acción
 */
export const PERMISSIONS = {
  // Services
  services: {
    read: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    create: [ROLES.ADMIN, ROLES.STAFF],
    update: [ROLES.ADMIN, ROLES.STAFF],
    delete: [ROLES.ADMIN, ROLES.STAFF],
  },

  // Professionals
  professionals: {
    read: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    create: [ROLES.ADMIN, ROLES.STAFF],
    update: [ROLES.ADMIN, ROLES.STAFF],
    delete: [ROLES.ADMIN, ROLES.STAFF],
  },

  // Clients
  clients: {
    read: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    create: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    update: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    delete: [ROLES.ADMIN, ROLES.STAFF],
  },

  // Appointments
  appointments: {
    read: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    create: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    update: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    updateStatus: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    delete: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
  },

  // Availability
  availability: {
    read: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    write: [ROLES.ADMIN, ROLES.STAFF],
  },

  // Users (gestión de usuarios)
  users: {
    read: [ROLES.ADMIN],
    create: [ROLES.ADMIN],
    update: [ROLES.ADMIN],
    delete: [ROLES.ADMIN],
  },

  // Queue (fila/turnero)
  queue: {
    read: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST, ROLES.PROFESSIONAL],
    create: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST], // Kiosco público usa token especial
    call: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    serve: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    done: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    cancel: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
    assignDesk: [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST],
  },
} as const;

export type Permission = typeof PERMISSIONS;
export type Resource = keyof Permission;

/**
 * Helper para verificar si un rol tiene permiso para una acción
 */
export function hasPermission(
  role: Role,
  resource: Resource,
  action: string
): boolean {
  const resourcePerms = PERMISSIONS[resource] as Record<string, readonly Role[]>;
  const allowedRoles = resourcePerms[action];
  return allowedRoles?.includes(role) ?? false;
}
