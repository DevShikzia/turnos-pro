import { Routes } from '@angular/router';
import { QueuePage } from './queue.page';
import { roleGuard } from '@core/guards/role.guard';

export const queueRoutes: Routes = [
  {
    path: '',
    component: QueuePage,
    canActivate: [roleGuard],
    data: {
      roles: ['admin', 'staff', 'receptionist'],
    },
  },
];
