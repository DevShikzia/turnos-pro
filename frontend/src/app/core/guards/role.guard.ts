import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { Role } from '@shared/models/api.types';

/**
 * Guard que verifica si el usuario tiene alguno de los roles permitidos
 * Uso en rutas: canActivate: [roleGuard], data: { roles: ['admin', 'staff'] }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as Role[] | undefined;

  if (!allowedRoles || allowedRoles.length === 0) {
    // Si no hay roles definidos, permitir acceso
    return true;
  }

  if (permissionService.hasAnyRole(...allowedRoles)) {
    return true;
  }

  // Si no tiene permisos, redirigir al dashboard
  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guard específico para rutas de admin/staff (no receptionist)
 */
export const adminStaffGuard: CanActivateFn = () => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  if (permissionService.isAdminOrStaff()) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};

/**
 * Guard específico para rutas solo de admin
 */
export const adminGuard: CanActivateFn = () => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  if (permissionService.hasRole('admin')) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
