import { Routes } from '@angular/router';

export const clientsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./clients-list.page').then((m) => m.ClientsListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./clients-form.page').then((m) => m.ClientsFormPage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./clients-form.page').then((m) => m.ClientsFormPage),
  },
];
