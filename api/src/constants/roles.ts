export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  RECEPTIONIST: 'receptionist',
  PROFESSIONAL: 'professional',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ALL_ROLES = Object.values(ROLES);

// Grupos de roles para autorización
export const ADMIN_STAFF = [ROLES.ADMIN, ROLES.STAFF] as const;
export const ALL_AUTHENTICATED = [ROLES.ADMIN, ROLES.STAFF, ROLES.RECEPTIONIST, ROLES.PROFESSIONAL] as const;
export const RECEPTIONIST_STAFF = [ROLES.RECEPTIONIST, ROLES.STAFF, ROLES.ADMIN] as const;
