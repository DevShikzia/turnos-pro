import { Routes } from '@angular/router';
import { adminStaffGuard } from '@core/guards/role.guard';

export const availabilityRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./availability.page').then((m) => m.AvailabilityPage),
    canActivate: [adminStaffGuard],
  },
];
