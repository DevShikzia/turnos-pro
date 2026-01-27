import { Routes } from '@angular/router';
import { publicGuard } from '@core/guards/auth.guard';

export const authRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./login.page').then((m) => m.LoginPage),
    canActivate: [publicGuard],
  },
];
