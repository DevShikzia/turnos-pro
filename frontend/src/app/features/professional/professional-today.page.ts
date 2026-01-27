import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DateTime } from 'luxon';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { ProfessionalApi } from './professional.api';
import { ProfessionalsApi } from '../professionals/professionals.api';
import { StorageService } from '@core/services/storage.service';
import { AppointmentDTO, AppointmentStatus, UserDTO } from '@shared/models/api.types';

interface StatusOption {
  label: string;
  value: AppointmentStatus;
  severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary';
}

@Component({
  selector: 'app-professional-today',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="page-container">
      <app-page-header
        title="Mis Turnos de Hoy"
        [subtitle]="'Fecha: ' + todayDate()"
      />

      @if (loading()) {
        <app-loading text="Cargando turnos..." />
      } @else if (appointments().length === 0) {
        <app-empty-state
          icon="pi-calendar"
          title="No hay turnos hoy"
          message="No tienes turnos programados para hoy"
        />
      } @else {
        <div class="card">
          <p-table
            [value]="appointments()"
            [paginator]="true"
            [rows]="20"
            [rowsPerPageOptions]="[10, 20, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} turnos"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Hora</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Estado</th>
                <th>Estado en Fila</th>
                <th>Notas</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-appointment>
              <tr>
                <td>
                  <div class="time-cell">
                    <strong>{{ formatTime(appointment.startAt) }}</strong>
                    <span class="time-end">{{ formatTime(appointment.endAt) }}</span>
                  </div>
                </td>
                <td>
                  <div>
                    <strong>{{ getClientName(appointment) }}</strong>
                    @if (getClientDni(appointment)) {
                      <div class="text-muted small">DNI: {{ getClientDni(appointment) }}</div>
                    }
                  </div>
                </td>
                <td>
                  {{ getServiceName(appointment) }}
                </td>
                <td>
                  <p-tag
                    [value]="getStatusLabel(appointment.status)"
                    [severity]="getStatusSeverity(appointment.status)"
                  />
                </td>
                <td>
                  @if (hasQueueTicket(appointment)) {
                    <p-tag value="En fila" severity="info" />
                  } @else {
                    <span class="text-muted">-</span>
                  }
                </td>
                <td>
                  @if (appointment.notes) {
                    <span class="text-muted">{{ appointment.notes }}</span>
                  } @else {
                    <span class="text-muted">-</span>
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>
    <p-toast />
  `,
  styles: [
    `
      .time-cell {
        display: flex;
        flex-direction: column;
      }
      .time-end {
        font-size: 0.875rem;
        color: var(--color-text-muted);
      }
      .small {
        font-size: 0.75rem;
      }
    `,
  ],
})
export class ProfessionalTodayPage implements OnInit {
  private professionalApi = inject(ProfessionalApi);
  private professionalsApi = inject(ProfessionalsApi);
  private storage = inject(StorageService);
  private messageService = inject(MessageService);

  appointments = signal<AppointmentDTO[]>([]);
  loading = signal(false);
  professionalId = signal<string | null>(null);
  todayDate = signal<string>('');

  statusOptions: StatusOption[] = [
    { label: 'Pendiente', value: 'pending', severity: 'warning' },
    { label: 'Confirmado', value: 'confirmed', severity: 'info' },
    { label: 'Atendido', value: 'attended', severity: 'success' },
    { label: 'Cancelado', value: 'cancelled', severity: 'danger' },
    { label: 'No asistió', value: 'no_show', severity: 'secondary' },
  ];

  ngOnInit(): void {
    const today = DateTime.now().setZone('America/Argentina/Buenos_Aires');
    this.todayDate.set(today.toFormat('dd/MM/yyyy'));
    this.loadProfessionalId();
  }

  loadProfessionalId(): void {
    const user = this.storage.getUser<UserDTO>();
    if (!user) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Usuario no autenticado',
      });
      return;
    }

    // Buscar professional por email del usuario
    this.professionalsApi.list({ search: user.email, limit: 1 }).subscribe({
      next: (response) => {
        if (response.data.length > 0) {
          this.professionalId.set(response.data[0]._id);
          this.loadAppointments();
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Atención',
            detail: 'No se encontró un profesional asociado a tu usuario',
          });
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del profesional',
        });
      },
    });
  }

  loadAppointments(): void {
    const profId = this.professionalId();
    if (!profId) return;

    this.loading.set(true);
    this.professionalApi.getTodayAppointments(profId).subscribe({
      next: (response) => {
        this.appointments.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los turnos',
        });
        this.loading.set(false);
      },
    });
  }

  getClientName(appointment: AppointmentDTO): string {
    if (typeof appointment.clientId === 'string') {
      return 'Cliente';
    }
    return appointment.clientId.fullName;
  }

  getClientDni(appointment: AppointmentDTO): string | null {
    if (typeof appointment.clientId === 'string') {
      return null;
    }
    return appointment.clientId.dni || null;
  }

  getServiceName(appointment: AppointmentDTO): string {
    if (typeof appointment.serviceId === 'string') {
      return 'Servicio';
    }
    return appointment.serviceId.name;
  }

  getStatusLabel(status: AppointmentStatus): string {
    const option = this.statusOptions.find((opt) => opt.value === status);
    return option?.label || status;
  }

  getStatusSeverity(status: AppointmentStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    const option = this.statusOptions.find((opt) => opt.value === status);
    if (!option) return 'secondary';
    return option.severity as 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';
  }

  formatTime(date: string): string {
    return DateTime.fromISO(date).setZone('America/Argentina/Buenos_Aires').toFormat('HH:mm');
  }

  hasQueueTicket(appointment: AppointmentDTO): boolean {
    // TODO: Verificar si el turno tiene un ticket en la fila
    // Por ahora retornamos false, pero se puede implementar consultando la API de queue
    return false;
  }
}
