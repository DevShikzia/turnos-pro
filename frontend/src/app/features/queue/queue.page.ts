import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { DateTime } from 'luxon';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { QueueApi } from './queue.api';
import { SocketService, QueueTicketEvent } from '@core/services/socket.service';
import { QueueTicketDTO, TicketStatus, TicketType } from '@shared/models/api.types';
import { QueueDesksComponent } from './queue-desks.component';
import { environment } from '../../../environments/environment';

interface StatusOption {
  label: string;
  value: TicketStatus | '';
  severity: 'success' | 'info' | 'warning' | 'danger' | 'secondary';
}

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    DropdownModule,
    ToastModule,
    TooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingComponent,
    QueueDesksComponent,
  ],
  providers: [MessageService],
  template: `
    <div class="page-container">
      <app-page-header title="Fila de Turnos" subtitle="Gestiona la fila de atención">
        <p-button
          label="Abrir pantalla pública"
          icon="pi pi-external-link"
          severity="info"
          (click)="openPublicScreen()"
        />
      </app-page-header>

      <!-- Desk Selector -->
      <app-queue-desks
        [selectedDesk]="selectedDesk()"
        (deskSelected)="onDeskSelected($event)"
      />

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <label>Estado</label>
          <p-dropdown
            [(ngModel)]="selectedStatus"
            [options]="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos"
            [showClear]="true"
            (onChange)="loadTickets()"
            styleClass="w-full"
          />
        </div>
        <div class="filter-group">
          <label>Tipo</label>
          <p-dropdown
            [(ngModel)]="selectedType"
            [options]="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos"
            [showClear]="true"
            (onChange)="loadTickets()"
            styleClass="w-full"
          />
        </div>
      </div>

      @if (loading()) {
        <app-loading text="Cargando fila..." />
      } @else if (tickets().length === 0) {
        <app-empty-state
          icon="pi-list"
          title="No hay tickets en la fila"
          message="Los tickets aparecerán aquí cuando se generen desde el kiosco"
        />
      } @else {
        <div class="card">
          <p-table
            [value]="tickets()"
            [paginator]="true"
            [rows]="20"
            [rowsPerPageOptions]="[10, 20, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} tickets"
            styleClass="p-datatable-sm"
            [globalFilterFields]="['code', 'dni']"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Código</th>
                <th>Tipo</th>
                <th>DNI</th>
                <th>Estado</th>
                <th>Ventanilla</th>
                <th>Llamado</th>
                <th>Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-ticket>
              <tr>
                <td>
                  <strong>{{ ticket.code }}</strong>
                </td>
                <td>
                  <p-tag
                    [value]="ticket.type === 'T' ? 'Turno' : 'Consulta'"
                    [severity]="ticket.type === 'T' ? 'success' : 'info'"
                  />
                </td>
                <td>
                  {{ ticket.dni }}
                  @if (ticket.clientNeedsData) {
                    <span
                      class="client-needs-data-badge"
                      [pTooltip]="'Este cliente debe completar sus datos antes de pedir un turno'"
                    >
                      <i class="pi pi-exclamation-triangle"></i>
                    </span>
                  }
                </td>
                <td>
                  <p-tag
                    [value]="getStatusLabel(ticket.status)"
                    [severity]="getStatusSeverity(ticket.status)"
                  />
                </td>
                <td>
                  @if (ticket.deskId) {
                    <p-tag [value]="ticket.deskId" severity="secondary" />
                  } @else {
                    <span class="text-muted">-</span>
                  }
                </td>
                <td>
                  @if (ticket.calledAt) {
                    {{ formatDate(ticket.calledAt) }}
                  } @else {
                    <span class="text-muted">-</span>
                  }
                </td>
                <td>
                  <div class="flex gap-2">
                    @if (ticket.status === 'waiting' && selectedDesk()) {
                      <p-button
                        icon="pi pi-phone"
                        [rounded]="true"
                        severity="success"
                        (click)="callTicket(ticket)"
                        [pTooltip]="'Llamar'"
                        styleClass="action-btn action-btn-success"
                      />
                    }
                    @if (ticket.status === 'called') {
                      <p-button
                        icon="pi pi-user"
                        [rounded]="true"
                        severity="info"
                        (click)="serveTicket(ticket)"
                        [pTooltip]="'En servicio'"
                        styleClass="action-btn action-btn-info"
                      />
                    }
                    @if (ticket.status === 'in_service') {
                      <p-button
                        icon="pi pi-check"
                        [rounded]="true"
                        severity="success"
                        (click)="doneTicket(ticket)"
                        [pTooltip]="'Completar'"
                        styleClass="action-btn action-btn-success"
                      />
                    }
                    @if (['waiting', 'called', 'in_service'].includes(ticket.status)) {
                      <p-button
                        icon="pi pi-times"
                        [rounded]="true"
                        severity="danger"
                        (click)="cancelTicket(ticket)"
                        [pTooltip]="'Cancelar'"
                        styleClass="action-btn action-btn-danger"
                      />
                    }
                  </div>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>
    <p-toast />
  `,
  styles: [`
    :host ::ng-deep .action-btn {
      min-width: 2.5rem;
      height: 2.5rem;
      padding: 0;
      
      .p-button-icon {
        font-size: 1rem;
      }
    }

    :host ::ng-deep .action-btn-success {
      background-color: #22c55e !important;
      border-color: #22c55e !important;
      color: white !important;

      &:hover {
        background-color: #16a34a !important;
        border-color: #16a34a !important;
      }
    }

    :host ::ng-deep .action-btn-info {
      background-color: #3b82f6 !important;
      border-color: #3b82f6 !important;
      color: white !important;

      &:hover {
        background-color: #2563eb !important;
        border-color: #2563eb !important;
      }
    }

    :host ::ng-deep .action-btn-danger {
      background-color: #ef4444 !important;
      border-color: #ef4444 !important;
      color: white !important;

      &:hover {
        background-color: #dc2626 !important;
        border-color: #dc2626 !important;
      }
    }
  `,
    `
      .filters-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }
      .filter-group {
        flex: 1;
        min-width: 200px;
      }
      .filter-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      .client-needs-data-badge {
        margin-left: 0.25rem;
        color: var(--orange-500);
        cursor: help;
      }
    `,
  ],
})
export class QueuePage implements OnInit, OnDestroy {
  private queueApi = inject(QueueApi);
  private socketService = inject(SocketService);
  private messageService = inject(MessageService);

  tickets = signal<QueueTicketDTO[]>([]);
  loading = signal(false);
  selectedStatus = signal<TicketStatus | ''>('');
  selectedType = signal<TicketType | ''>('');
  selectedDesk = signal<string | null>(null);

  statusOptions: StatusOption[] = [
    { label: 'Esperando', value: 'waiting', severity: 'warning' },
    { label: 'Llamado', value: 'called', severity: 'info' },
    { label: 'En servicio', value: 'in_service', severity: 'info' },
    { label: 'Completado', value: 'done', severity: 'success' },
    { label: 'Cancelado', value: 'cancelled', severity: 'danger' },
    { label: 'No asistió', value: 'no_show', severity: 'secondary' },
  ];

  typeOptions = [
    { label: 'Turno', value: 'T' },
    { label: 'Consulta', value: 'C' },
  ];

  ngOnInit(): void {
    // Cargar ventanilla desde sessionStorage si existe
    const savedDesk = sessionStorage.getItem('queue_selected_desk');
    if (savedDesk) {
      this.selectedDesk.set(savedDesk);
      // Verificar que la asignación sigue activa en el backend
      this.verifyDeskAssignment(savedDesk);
    }
    
    this.loadTickets();
    this.connectSocket();
  }

  private verifyDeskAssignment(deskId: string): void {
    this.queueApi.getDesks('main').subscribe({
      next: (response) => {
        const desk = response.data.find((d) => d.deskId === deskId && d.active);
        const user = JSON.parse(localStorage.getItem('turnos_user') || '{}');
        
        // Si la ventanilla está asignada a otro usuario, limpiar
        if (desk && desk.receptionistId !== user._id) {
          sessionStorage.removeItem('queue_selected_desk');
          this.selectedDesk.set(null);
          this.messageService.add({
            severity: 'warn',
            summary: 'Ventanilla no disponible',
            detail: 'La ventanilla fue asignada a otro agente',
          });
        } else if (!desk) {
          // Si no existe la asignación, intentar reasignar
          this.queueApi.assignDesk({ deskId, locationId: 'main' }).subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Ventanilla restaurada',
                detail: `Ventanilla ${deskId} restaurada`,
              });
              this.connectSocket();
            },
            error: () => {
              // Si falla, limpiar
              sessionStorage.removeItem('queue_selected_desk');
              this.selectedDesk.set(null);
            },
          });
        }
      },
      error: () => {
        // Si falla la verificación, mantener la selección
      },
    });
  }

  ngOnDestroy(): void {
    this.socketService.disconnect();
  }

  connectSocket(): void {
    this.socketService.connect('main', this.selectedDesk() || undefined);

    this.socketService.onTicketCreated((ticket) => {
      this.loadTickets();
    });

    this.socketService.onTicketUpdated((ticket) => {
      this.loadTickets();
    });
  }

  loadTickets(): void {
    this.loading.set(true);
    const today = DateTime.now().setZone('America/Argentina/Buenos_Aires').toFormat('yyyy-MM-dd');

    const params: any = {
      dateKey: today,
      locationId: 'main',
      page: 1,
      limit: 100,
    };

    if (this.selectedStatus()) {
      params.status = this.selectedStatus();
    }

    if (this.selectedType()) {
      params.type = this.selectedType();
    }

    this.queueApi.list(params).subscribe({
      next: (response) => {
        this.tickets.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la fila',
        });
        this.loading.set(false);
      },
    });
  }

  onDeskSelected(deskId: string | null): void {
    // Actualizar signal primero
    this.selectedDesk.set(deskId);
    
    if (deskId) {
      // Guardar en sessionStorage inmediatamente
      sessionStorage.setItem('queue_selected_desk', deskId);
      
      this.queueApi.assignDesk({ deskId, locationId: 'main' }).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Ventanilla asignada',
            detail: `Ventanilla ${deskId} asignada`,
          });
          this.connectSocket(); // Reconectar con nuevo deskId
        },
        error: (error) => {
          // Si falla, limpiar selección
          this.selectedDesk.set(null);
          sessionStorage.removeItem('queue_selected_desk');
          
          const errorMsg = error?.error?.error?.message || 'No se pudo asignar la ventanilla';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: errorMsg,
          });
        },
      });
    } else {
      // Desasignar ventanilla
      sessionStorage.removeItem('queue_selected_desk');
      this.connectSocket(); // Reconectar sin deskId
    }
  }

  callTicket(ticket: QueueTicketDTO): void {
    if (!this.selectedDesk()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atención',
        detail: 'Debes seleccionar una ventanilla primero',
      });
      return;
    }

    this.queueApi.call(ticket._id, { deskId: this.selectedDesk()! }).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Ticket llamado',
          detail: `${ticket.code} llamado en ${this.selectedDesk()}`,
        });
        if (response.data?.clientNeedsData) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Completar datos del cliente',
            detail: 'Este cliente necesita completar sus datos (nombre, teléfono, etc.) antes de pedir un turno.',
            life: 8000,
          });
        }
        this.loadTickets();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo llamar el ticket',
        });
      },
    });
  }

  serveTicket(ticket: QueueTicketDTO): void {
    this.queueApi.serve(ticket._id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'En servicio',
          detail: `${ticket.code} en atención`,
        });
        this.loadTickets();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo marcar como en servicio',
        });
      },
    });
  }

  doneTicket(ticket: QueueTicketDTO): void {
    this.queueApi.done(ticket._id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Completado',
          detail: `${ticket.code} completado`,
        });
        this.loadTickets();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo completar el ticket',
        });
      },
    });
  }

  cancelTicket(ticket: QueueTicketDTO): void {
    this.queueApi.cancel(ticket._id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cancelado',
          detail: `${ticket.code} cancelado`,
        });
        this.loadTickets();
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cancelar el ticket',
        });
      },
    });
  }

  getStatusLabel(status: TicketStatus): string {
    const option = this.statusOptions.find((opt) => opt.value === status);
    return option?.label || status;
  }

  getStatusSeverity(status: TicketStatus): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    const option = this.statusOptions.find((opt) => opt.value === status);
    if (!option) return 'secondary';
    return option.severity as 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast';
  }

  formatDate(date: string): string {
    return DateTime.fromISO(date).setZone('America/Argentina/Buenos_Aires').toFormat('HH:mm');
  }

  openPublicScreen(): void {
    const kioskUrl = `${environment.kioskUrl}/screen`;
    window.open(kioskUrl, '_blank', 'width=1920,height=1080');
  }
}
