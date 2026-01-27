import { Routes } from '@angular/router';

export const professionalsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./professionals-list.page').then((m) => m.ProfessionalsListPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./professionals-form.page').then((m) => m.ProfessionalsFormPage),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./professionals-form.page').then((m) => m.ProfessionalsFormPage),
  },
];
