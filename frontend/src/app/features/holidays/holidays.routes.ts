import { Routes } from '@angular/router';

export const holidaysRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./holidays.page').then((m) => m.HolidaysPage),
  },
];
