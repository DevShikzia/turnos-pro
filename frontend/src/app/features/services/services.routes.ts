import { Routes } from '@angular/router';

export const servicesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./services-list.page').then((m) => m.ServicesListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./services-form.page').then((m) => m.ServicesFormPage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./services-form.page').then((m) => m.ServicesFormPage),
  },
];
