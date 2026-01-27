import { Routes } from '@angular/router';
import { ProfessionalTodayPage } from './professional-today.page';
import { roleGuard } from '@core/guards/role.guard';

export const professionalRoutes: Routes = [
  {
    path: 'today',
    component: ProfessionalTodayPage,
    canActivate: [roleGuard],
    data: {
      roles: ['professional'],
    },
  },
  {
    path: '',
    redirectTo: 'today',
    pathMatch: 'full',
  },
];
