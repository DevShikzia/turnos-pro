import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { StatsCardComponent } from '@shared/ui/stats-card/stats-card.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { AppointmentsApi } from '../appointments/appointments.api';
import { AppointmentDTO } from '@shared/models/api.types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    ToastModule,
    PageHeaderComponent,
    StatsCardComponent,
    LoadingComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header title="Dashboard" subtitle="Resumen del día">
        <p-button
          label="Nuevo turno"
          icon="pi pi-plus"
          routerLink="/appointments/new"
        />
      </app-page-header>

      @if (loading()) {
        <app-loading text="Cargando estadísticas..." />
      } @else {
        <!-- Stats Grid -->
        <div class="stats-grid">
          <app-stats-card
            [value]="stats().total"
            label="Turnos hoy"
            icon="pi-calendar"
            color="primary"
          />
          <app-stats-card
            [value]="stats().confirmed"
            label="Confirmados"
            icon="pi-check-circle"
            color="info"
          />
          <app-stats-card
            [value]="stats().pending"
            label="Pendientes"
            icon="pi-clock"
            color="warning"
          />
          <app-stats-card
            [value]="stats().attended"
            label="Atendidos"
            icon="pi-user-plus"
            color="success"
          />
          <app-stats-card
            [value]="stats().cancelled"
            label="Cancelados"
            icon="pi-times-circle"
            color="danger"
          />
          <app-stats-card
            [value]="stats().noShow"
            label="No asistieron"
            icon="pi-user-minus"
            color="danger"
          />
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <h2 class="section-title">Acciones rápidas</h2>
          <div class="actions-grid">
            <a routerLink="/appointments" class="action-card">
              <i class="pi pi-calendar"></i>
              <span>Ver turnos</span>
            </a>
            <a routerLink="/clients/new" class="action-card">
              <i class="pi pi-user-plus"></i>
              <span>Nuevo cliente</span>
            </a>
            <a routerLink="/professionals" class="action-card">
              <i class="pi pi-id-card"></i>
              <span>Profesionales</span>
            </a>
            <a routerLink="/services" class="action-card">
              <i class="pi pi-list"></i>
              <span>Servicios</span>
            </a>
          </div>
        </div>

        <!-- Today's Appointments -->
        @if (todayAppointments().length > 0) {
          <div class="today-appointments">
            <h2 class="section-title">Próximos turnos de hoy</h2>
            <div class="appointments-list">
              @for (apt of todayAppointments().slice(0, 5); track apt._id) {
                <div class="appointment-item">
                  <div class="appointment-time">
                    {{ formatTime(apt.startAt) }}
                  </div>
                  <div class="appointment-info">
                    <span class="client-name">
                      {{ getClientName(apt) }}
                    </span>
                    <span class="service-name">
                      {{ getServiceName(apt) }}
                    </span>
                  </div>
                  <span class="status-badge" [class]="'status-' + apt.status">
                    {{ getStatusLabel(apt.status) }}
                  </span>
                </div>
              }
            </div>
            @if (todayAppointments().length > 5) {
              <p-button
                label="Ver todos los turnos"
                [link]="true"
                routerLink="/appointments"
              />
            }
          </div>
        }
      }
    </div>
    <p-toast />
  `,
  styles: [`
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-xl);
    }

    .quick-actions {
      margin-bottom: var(--spacing-xl);
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: var(--spacing-md);
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-lg);
      background: var(--color-surface);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-lg);
      text-decoration: none;
      color: var(--color-text);
      transition: all var(--transition-fast);

      &:hover {
        border-color: var(--color-primary);
        background: var(--color-primary-light);
        color: var(--color-primary);
      }

      i {
        font-size: 1.5rem;
      }

      span {
        font-weight: 500;
        font-size: 0.875rem;
      }
    }

    .today-appointments {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      border: 1px solid var(--color-border-light);
    }

    .appointments-list {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .appointment-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md);
      background: var(--color-bg);
      border-radius: var(--radius-md);
    }

    .appointment-time {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-primary);
      min-width: 60px;
    }

    .appointment-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .client-name {
      font-weight: 500;
      color: var(--color-text);
    }

    .service-name {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }
  `],
})
export class DashboardPage implements OnInit {
  private appointmentsApi = inject(AppointmentsApi);

  loading = signal(true);
  todayAppointments = signal<AppointmentDTO[]>([]);
  stats = signal({
    total: 0,
    confirmed: 0,
    pending: 0,
    attended: 0,
    cancelled: 0,
    noShow: 0,
  });

  ngOnInit(): void {
    this.loadTodayAppointments();
  }

  private loadTodayAppointments(): void {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    this.appointmentsApi.list({ dateFrom: startOfDay, dateTo: endOfDay, limit: 100 }).subscribe({
      next: (response) => {
        const appointments = response.data;
        this.todayAppointments.set(appointments);

        this.stats.set({
          total: appointments.length,
          confirmed: appointments.filter((a) => a.status === 'confirmed').length,
          pending: appointments.filter((a) => a.status === 'pending').length,
          attended: appointments.filter((a) => a.status === 'attended').length,
          cancelled: appointments.filter((a) => a.status === 'cancelled').length,
          noShow: appointments.filter((a) => a.status === 'no_show').length,
        });

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getClientName(apt: AppointmentDTO): string {
    if (typeof apt.clientId === 'object' && apt.clientId?.fullName) {
      return apt.clientId.fullName;
    }
    return 'Cliente';
  }

  getServiceName(apt: AppointmentDTO): string {
    if (typeof apt.serviceId === 'object' && apt.serviceId?.name) {
      return apt.serviceId.name;
    }
    return 'Servicio';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      confirmed: 'Confirmado',
      attended: 'Atendido',
      cancelled: 'Cancelado',
      no_show: 'No asistió',
    };
    return labels[status] || status;
  }
}
