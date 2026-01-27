import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./users-list.page').then((m) => m.UsersListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./users-form.page').then((m) => m.UsersFormPage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./users-form.page').then((m) => m.UsersFormPage),
  },
];
