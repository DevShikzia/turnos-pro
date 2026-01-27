import { Routes } from '@angular/router';
import { publicGuard } from '@core/guards/auth.guard';

export const setupAdminRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./setup-admin.page').then((m) => m.SetupAdminPage),
    canActivate: [publicGuard],
  },
];
