import { Routes } from '@angular/router';

export const appointmentsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./appointments-list.page').then((m) => m.AppointmentsListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./appointments-form.page').then((m) => m.AppointmentsFormPage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./appointments-form.page').then((m) => m.AppointmentsFormPage),
  },
];
