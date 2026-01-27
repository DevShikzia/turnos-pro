import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage.service';
import { Role, UserDTO } from '@shared/models/api.types';

/**
 * Permisos por recurso y acción
 * Debe coincidir con los permisos del backend
 */
const PERMISSIONS = {
  services: {
    read: ['admin', 'staff', 'receptionist'] as Role[],
    create: ['admin', 'staff'] as Role[],
    update: ['admin', 'staff'] as Role[],
    delete: ['admin', 'staff'] as Role[],
  },
  professionals: {
    read: ['admin', 'staff', 'receptionist'] as Role[],
    create: ['admin', 'staff'] as Role[],
    update: ['admin', 'staff'] as Role[],
    delete: ['admin', 'staff'] as Role[],
  },
  clients: {
    read: ['admin', 'staff', 'receptionist'] as Role[],
    create: ['admin', 'staff', 'receptionist'] as Role[],
    update: ['admin', 'staff', 'receptionist'] as Role[],
    delete: ['admin', 'staff'] as Role[],
  },
  appointments: {
    read: ['admin', 'staff', 'receptionist'] as Role[],
    create: ['admin', 'staff', 'receptionist'] as Role[],
    update: ['admin', 'staff', 'receptionist'] as Role[],
    delete: ['admin', 'staff', 'receptionist'] as Role[],
  },
  availability: {
    read: ['admin', 'staff', 'receptionist'] as Role[],
    write: ['admin', 'staff'] as Role[],
  },
  users: {
    read: ['admin'] as Role[],
    create: ['admin'] as Role[],
    update: ['admin'] as Role[],
    delete: ['admin'] as Role[],
  },
} as const;

type Resource = keyof typeof PERMISSIONS;

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private storage = inject(StorageService);

  /**
   * Obtiene el rol del usuario actual
   */
  getCurrentRole(): Role | null {
    const user = this.storage.getUser<UserDTO>();
    return user?.role ?? null;
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: Role): boolean {
    return this.getCurrentRole() === role;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(...roles: Role[]): boolean {
    const currentRole = this.getCurrentRole();
    return currentRole !== null && roles.includes(currentRole);
  }

  /**
   * Verifica si es admin o staff
   */
  isAdminOrStaff(): boolean {
    return this.hasAnyRole('admin', 'staff');
  }

  /**
   * Verifica si es recepcionista
   */
  isReceptionist(): boolean {
    return this.hasRole('receptionist');
  }

  // ============================================
  // Permisos por recurso
  // ============================================

  canManageServices(): boolean {
    return this.hasAnyRole(...PERMISSIONS.services.create);
  }

  canManageProfessionals(): boolean {
    return this.hasAnyRole(...PERMISSIONS.professionals.create);
  }

  canDeleteClients(): boolean {
    return this.hasAnyRole(...PERMISSIONS.clients.delete);
  }

  canManageAvailability(): boolean {
    return this.hasAnyRole(...PERMISSIONS.availability.write);
  }

  canManageUsers(): boolean {
    return this.hasAnyRole(...PERMISSIONS.users.create);
  }

  // ============================================
  // Verificación genérica
  // ============================================

  /**
   * Verifica permisos de forma genérica
   */
  can(resource: Resource, action: string): boolean {
    const resourcePerms = PERMISSIONS[resource] as Record<string, Role[]>;
    const allowedRoles = resourcePerms[action];
    if (!allowedRoles) return false;

    const currentRole = this.getCurrentRole();
    return currentRole !== null && allowedRoles.includes(currentRole);
  }
}
