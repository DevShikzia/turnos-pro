import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { adminStaffGuard, adminGuard } from '@core/guards/role.guard';
import { ShellComponent } from '@core/layout/shell.component';

export const routes: Routes = [
  // Public routes
  {
    path: 'setup',
    loadChildren: () => import('./features/setup-admin/setup-admin.routes').then((m) => m.setupAdminRoutes),
  },
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },

  // Protected routes (with shell layout)
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.dashboardRoutes),
      },
      {
        path: 'clients',
        loadChildren: () => import('./features/clients/clients.routes').then((m) => m.clientsRoutes),
      },
      {
        path: 'services',
        loadChildren: () => import('./features/services/services.routes').then((m) => m.servicesRoutes),
        canActivate: [adminStaffGuard],
      },
      {
        path: 'professionals',
        loadChildren: () => import('./features/professionals/professionals.routes').then((m) => m.professionalsRoutes),
        canActivate: [adminStaffGuard],
      },
      {
        path: 'appointments',
        loadChildren: () => import('./features/appointments/appointments.routes').then((m) => m.appointmentsRoutes),
      },
      {
        path: 'availability',
        loadChildren: () => import('./features/availability/availability.routes').then((m) => m.availabilityRoutes),
        canActivate: [adminStaffGuard],
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then((m) => m.usersRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'holidays',
        loadChildren: () => import('./features/holidays/holidays.routes').then((m) => m.holidaysRoutes),
        canActivate: [adminStaffGuard],
      },
      {
        path: 'queue',
        loadChildren: () => import('./features/queue/queue.routes').then((m) => m.queueRoutes),
      },
      {
        path: 'professional',
        loadChildren: () => import('./features/professional/professional.routes').then((m) => m.professionalRoutes),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  // Fallback
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
