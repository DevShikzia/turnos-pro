import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { AppointmentsApi } from './appointments.api';
import { ProfessionalsApi } from '../professionals/professionals.api';
import { ClientsApi } from '../clients/clients.api';
import {
  AppointmentDTO,
  AppointmentStatus,
  ProfessionalDTO,
  ClientDTO,
  ServiceDTO,
} from '@shared/models/api.types';
import { environment } from '@env';

interface StatusOption {
  label: string;
  value: AppointmentStatus;
  severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary';
}

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DropdownModule,
    CalendarModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header title="Turnos" [subtitle]="pageSubtitle">
        @if (!environment.demoMode) {
          <p-button
            label="Nuevo turno"
            icon="pi pi-plus"
            routerLink="/appointments/new"
          />
        }
      </app-page-header>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <label>Fecha</label>
          <p-calendar
            [(ngModel)]="dateRange"
            selectionMode="range"
            [readonlyInput]="true"
            placeholder="Seleccionar rango"
            dateFormat="dd/mm/yy"
            (onSelect)="onFilterChange()"
            (onClear)="onFilterChange()"
            [showClear]="true"
            styleClass="w-full"
          />
        </div>

        <div class="filter-group">
          <label>Profesional</label>
          <p-dropdown
            [(ngModel)]="selectedProfessional"
            [options]="professionals()"
            optionLabel="fullName"
            optionValue="_id"
            placeholder="Todos"
            [showClear]="true"
            (onChange)="onFilterChange()"
            styleClass="w-full"
          />
        </div>

        <div class="filter-group">
          <label>Estado</label>
          <p-dropdown
            [(ngModel)]="selectedStatus"
            [options]="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos"
            [showClear]="true"
            (onChange)="onFilterChange()"
            styleClass="w-full"
          />
        </div>

        @if (filterClientId) {
          <div class="filter-group">
            <label>Cliente</label>
            <div class="client-filter">
              <span>{{ filterClientName || 'Cargando...' }}</span>
              <p-button
                icon="pi pi-times"
                [rounded]="true"
                severity="secondary"
                size="small"
                (onClick)="clearClientFilter()"
                pTooltip="Quitar filtro"
              />
            </div>
          </div>
        }
      </div>

      @if (loading()) {
        <app-loading text="Cargando turnos..." />
      } @else if (appointments().length === 0) {
        <app-empty-state
          icon="pi-calendar"
          title="No hay turnos"
          [message]="hasFilters() ? 'No se encontraron turnos con los filtros aplicados' : 'Comienza agendando tu primer turno'"
        >
          @if (!hasFilters()) {
            <p-button
              label="Agendar turno"
              icon="pi pi-plus"
              routerLink="/appointments/new"
            />
          }
        </app-empty-state>
      } @else {
        <div class="card">
          <p-table
            [value]="appointments()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [loading]="tableLoading()"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Fecha/Hora</th>
                <th>Cliente</th>
                <th class="hide-mobile">Profesional</th>
                <th class="hide-mobile">Servicio</th>
                <th>Estado</th>
                <th style="width: 150px">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-apt>
              <tr>
                <td>
                  <div class="datetime-cell">
                    <span class="date">{{ formatDate(apt.startAt) }}</span>
                    <span class="time">{{ formatTime(apt.startAt) }} - {{ formatTime(apt.endAt) }}</span>
                  </div>
                </td>
                <td>
                  <span class="font-medium">{{ getClientName(apt) }}</span>
                </td>
                <td class="hide-mobile">{{ getProfessionalName(apt) }}</td>
                <td class="hide-mobile">{{ getServiceName(apt) }}</td>
                <td>
                  <p-tag
                    [value]="getStatusLabel(apt.status)"
                    [severity]="getStatusSeverity(apt.status)"
                  />
                </td>
                <td>
                  <div class="actions">
                    <p-button
                      icon="pi pi-sync"
                      [rounded]="true"
                      severity="info"
                      size="small"
                      pTooltip="Cambiar estado"
                      (onClick)="openStatusDialog(apt)"
                    />
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      severity="warning"
                      size="small"
                      [routerLink]="['/appointments', apt._id, 'edit']"
                      pTooltip="Editar"
                    />
                    <p-button
                      icon="pi pi-times"
                      [rounded]="true"
                      severity="danger"
                      size="small"
                      (onClick)="confirmCancel(apt)"
                      pTooltip="Cancelar"
                      [disabled]="apt.status === 'cancelled'"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>

    <!-- Status Change Dialog -->
    <p-dialog
      header="Cambiar estado del turno"
      [(visible)]="statusDialogVisible"
      [modal]="true"
      [style]="{ width: '400px' }"
    >
      @if (selectedAppointment()) {
        <div class="status-dialog-content">
          <p class="mb-3">
            <strong>{{ getClientName(selectedAppointment()!) }}</strong><br>
            {{ formatDate(selectedAppointment()!.startAt) }} a las {{ formatTime(selectedAppointment()!.startAt) }}
          </p>

          <div class="form-group">
            <label>Nuevo estado</label>
            <p-dropdown
              [(ngModel)]="newStatus"
              [options]="statusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar estado"
              styleClass="w-full"
            />
          </div>
        </div>
      }

      <ng-template pTemplate="footer">
        <p-button
          label="Cancelar"
          severity="secondary"
          (onClick)="statusDialogVisible = false"
          styleClass="btn-cancel"
        />
        <p-button
          label="Guardar"
          icon="pi pi-check"
          [loading]="updatingStatus()"
          (onClick)="updateStatus()"
          [disabled]="!newStatus"
        />
      </ng-template>
    </p-dialog>

    <p-toast />
    <p-confirmDialog />
  `,
  styles: [`
    .filters-bar {
      display: flex;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-lg);
      flex-wrap: wrap;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .filter-group {
      min-width: 200px;

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-xs);
      }

      @media (max-width: 768px) {
        min-width: 100%;
      }
    }

    .client-filter {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm) var(--spacing-md);
      background: var(--color-primary-light);
      border-radius: var(--radius-md);
      color: var(--color-primary);
      font-weight: 500;
    }

    .datetime-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .date {
        font-weight: 500;
      }

      .time {
        font-size: 0.875rem;
        color: var(--color-text-secondary);
      }
    }

    .actions {
      display: flex;
      gap: var(--spacing-xs);
    }

    .status-dialog-content {
      .form-group {
        margin-top: var(--spacing-md);

        label {
          display: block;
          font-weight: 500;
          margin-bottom: var(--spacing-xs);
        }
      }
    }

    :host ::ng-deep .btn-cancel {
      background-color: #6c757d !important;
      border-color: #6c757d !important;
      color: white !important;

      &:hover {
        background-color: #5a6268 !important;
        border-color: #545b62 !important;
      }
    }
  `],
})
export class AppointmentsListPage implements OnInit {
  environment = environment;
  private route = inject(ActivatedRoute);
  private appointmentsApi = inject(AppointmentsApi);
  private professionalsApi = inject(ProfessionalsApi);
  private clientsApi = inject(ClientsApi);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  loading = signal(true);
  tableLoading = signal(false);
  appointments = signal<AppointmentDTO[]>([]);
  professionals = signal<ProfessionalDTO[]>([]);

  dateRange: Date[] | null = null;
  selectedProfessional: string | null = null;
  selectedStatus: AppointmentStatus | null = null;

  // Client filter from query params
  filterClientId: string | null = null;
  filterClientName: string | null = null;

  // Status dialog
  statusDialogVisible = false;
  selectedAppointment = signal<AppointmentDTO | null>(null);
  newStatus: AppointmentStatus | null = null;
  updatingStatus = signal(false);

  statusOptions: StatusOption[] = [
    { label: 'Pendiente', value: 'pending', severity: 'warning' },
    { label: 'Confirmado', value: 'confirmed', severity: 'info' },
    { label: 'Atendido', value: 'attended', severity: 'success' },
    { label: 'No asistió', value: 'no_show', severity: 'secondary' },
    { label: 'Cancelado', value: 'cancelled', severity: 'danger' },
  ];

  get pageSubtitle(): string {
    if (this.filterClientName) {
      return `Turnos de ${this.filterClientName}`;
    }
    return 'Gestiona las citas de tus clientes';
  }

  ngOnInit(): void {
    // Check for client filter in query params
    this.filterClientId = this.route.snapshot.queryParams['clientId'] || null;

    // Set default date range to today (only if no client filter)
    if (!this.filterClientId) {
      const today = new Date();
      this.dateRange = [today, today];
    }

    // Load client name if filtering by client
    if (this.filterClientId) {
      this.loadClientName();
    }

    this.loadProfessionals();
    this.loadAppointments();
  }

  private loadClientName(): void {
    if (!this.filterClientId) return;

    this.clientsApi.getById(this.filterClientId).subscribe({
      next: (response) => {
        this.filterClientName = response.data.fullName;
      },
    });
  }

  clearClientFilter(): void {
    this.filterClientId = null;
    this.filterClientName = null;
    const today = new Date();
    this.dateRange = [today, today];
    this.loadAppointments();
  }

  private loadProfessionals(): void {
    this.professionalsApi.list({ isActive: true, limit: 100 }).subscribe({
      next: (response) => this.professionals.set(response.data),
    });
  }

  loadAppointments(): void {
    const params: Record<string, string | undefined> = {};

    if (this.dateRange?.[0]) {
      params['dateFrom'] = new Date(this.dateRange[0].setHours(0, 0, 0, 0)).toISOString();
    }
    if (this.dateRange?.[1]) {
      params['dateTo'] = new Date(this.dateRange[1].setHours(23, 59, 59, 999)).toISOString();
    }
    if (this.selectedProfessional) {
      params['professionalId'] = this.selectedProfessional;
    }
    if (this.selectedStatus) {
      params['status'] = this.selectedStatus;
    }
    if (this.filterClientId) {
      params['clientId'] = this.filterClientId;
    }

    this.appointmentsApi.list({ ...params, limit: 100 } as any).subscribe({
      next: (response) => {
        this.appointments.set(response.data);
        this.loading.set(false);
        this.tableLoading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.tableLoading.set(false);
      },
    });
  }

  onFilterChange(): void {
    this.tableLoading.set(true);
    this.loadAppointments();
  }

  hasFilters(): boolean {
    return !!(this.dateRange || this.selectedProfessional || this.selectedStatus || this.filterClientId);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getClientName(apt: AppointmentDTO): string {
    if (typeof apt.clientId === 'object') {
      return (apt.clientId as ClientDTO).fullName;
    }
    return 'Cliente';
  }

  getProfessionalName(apt: AppointmentDTO): string {
    if (typeof apt.professionalId === 'object') {
      return (apt.professionalId as ProfessionalDTO).fullName;
    }
    return 'Profesional';
  }

  getServiceName(apt: AppointmentDTO): string {
    if (typeof apt.serviceId === 'object') {
      return (apt.serviceId as ServiceDTO).name;
    }
    return 'Servicio';
  }

  getStatusLabel(status: AppointmentStatus): string {
    const found = this.statusOptions.find((s) => s.value === status);
    return found?.label || status;
  }

  getStatusSeverity(status: AppointmentStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
    const found = this.statusOptions.find((s) => s.value === status);
    return found?.severity || 'secondary';
  }

  openStatusDialog(apt: AppointmentDTO): void {
    this.selectedAppointment.set(apt);
    this.newStatus = apt.status;
    this.statusDialogVisible = true;
  }

  updateStatus(): void {
    const apt = this.selectedAppointment();
    if (!apt || !this.newStatus) return;

    this.updatingStatus.set(true);

    this.appointmentsApi.updateStatus(apt._id, { status: this.newStatus }).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Estado actualizado',
          detail: `El turno ahora está ${this.getStatusLabel(this.newStatus!).toLowerCase()}`,
        });
        this.statusDialogVisible = false;
        this.updatingStatus.set(false);
        this.loadAppointments();
      },
      error: () => {
        this.updatingStatus.set(false);
      },
    });
  }

  confirmCancel(apt: AppointmentDTO): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de cancelar el turno de ${this.getClientName(apt)}?`,
      header: 'Confirmar cancelación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cancelar',
      rejectLabel: 'No',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cancelAppointment(apt),
    });
  }

  private cancelAppointment(apt: AppointmentDTO): void {
    this.appointmentsApi.delete(apt._id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Turno cancelado',
          detail: 'El turno ha sido cancelado correctamente',
        });
        this.loadAppointments();
      },
    });
  }
}
