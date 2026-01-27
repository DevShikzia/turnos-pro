import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { ClientsApi } from './clients.api';
import { AppointmentsApi } from '../appointments/appointments.api';
import { ClientDTO, AppointmentDTO } from '@shared/models/api.types';
import { PermissionService } from '@core/services/permission.service';

@Component({
  selector: 'app-clients-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header title="Clientes" subtitle="Gestiona tus clientes">
        <p-button
          label="Nuevo cliente"
          icon="pi pi-plus"
          routerLink="/clients/new"
        />
      </app-page-header>

      <!-- Search -->
      <div class="search-bar">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search"></i>
          <input
            pInputText
            type="text"
            [(ngModel)]="searchTerm"
            (input)="onSearch()"
            placeholder="Buscar por nombre, DNI, email o teléfono..."
            class="w-full"
          />
        </span>
      </div>

      @if (loading()) {
        <app-loading text="Cargando clientes..." />
      } @else if (clients().length === 0 && !searchTerm) {
        <app-empty-state
          icon="pi-users"
          title="No hay clientes"
          message="Comienza agregando tu primer cliente"
        >
          <p-button
            label="Agregar cliente"
            icon="pi pi-plus"
            routerLink="/clients/new"
          />
        </app-empty-state>
      } @else {
        <div class="card">
          <p-table
            [value]="clients()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} clientes"
            [loading]="tableLoading()"
            [globalFilterFields]="['fullName', 'dni', 'email', 'phone']"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th class="hide-mobile">Email</th>
                <th class="hide-mobile">Teléfono</th>
                <th>Estado</th>
                <th style="width: 180px">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-client>
              <tr>
                <td>
                  <div class="client-name">
                    <span class="name">{{ client.fullName }}</span>
                    @if (client.notes) {
                      <span class="notes">{{ client.notes }}</span>
                    }
                  </div>
                </td>
                <td>{{ client.dni }}</td>
                <td class="hide-mobile">{{ client.email || '-' }}</td>
                <td class="hide-mobile">{{ client.phone || '-' }}</td>
                <td>
                  <p-tag
                    [value]="client.isActive ? 'Activo' : 'Inactivo'"
                    [severity]="client.isActive ? 'success' : 'danger'"
                  />
                </td>
                <td>
                  <div class="actions">
                    <p-button
                      icon="pi pi-calendar-plus"
                      [rounded]="true"
                      severity="success"
                      size="small"
                      (onClick)="createAppointment(client)"
                      pTooltip="Sacar turno"
                    />
                    <p-button
                      icon="pi pi-calendar"
                      [rounded]="true"
                      severity="info"
                      size="small"
                      (onClick)="viewAppointments(client)"
                      pTooltip="Ver turnos"
                    />
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      severity="warning"
                      size="small"
                      [routerLink]="['/clients', client._id, 'edit']"
                      pTooltip="Editar"
                    />
                    @if (permissionService.canDeleteClients()) {
                      <p-button
                        icon="pi pi-trash"
                        [rounded]="true"
                        severity="danger"
                        size="small"
                        (onClick)="confirmDelete(client)"
                        pTooltip="Eliminar"
                      />
                    }
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="6" class="text-center p-4">
                  No se encontraron clientes
                </td>
              </tr>
            </ng-template>
          </p-table>
        </div>
      }
    </div>
    <p-toast />
    <p-confirmDialog />
  `,
  styles: [`
    .search-bar {
      margin-bottom: var(--spacing-lg);
      max-width: 400px;
    }

    .client-name {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .name {
        font-weight: 500;
      }

      .notes {
        font-size: 0.75rem;
        color: var(--color-text-muted);
      }
    }

    .actions {
      display: flex;
      gap: var(--spacing-xs);
    }
  `],
})
export class ClientsListPage implements OnInit {
  private clientsApi = inject(ClientsApi);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  permissionService = inject(PermissionService);

  loading = signal(true);
  tableLoading = signal(false);
  clients = signal<ClientDTO[]>([]);
  searchTerm = '';

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadClients();
  }

  private loadClients(search?: string): void {
    this.clientsApi.list({ search, limit: 100 }).subscribe({
      next: (response) => {
        this.clients.set(response.data);
        this.loading.set(false);
        this.tableLoading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.tableLoading.set(false);
      },
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.tableLoading.set(true);
      this.loadClients(this.searchTerm || undefined);
    }, 300);
  }

  createAppointment(client: ClientDTO): void {
    // Navegar a crear turno con el cliente preseleccionado
    this.router.navigate(['/appointments/new'], {
      queryParams: { clientId: client._id }
    });
  }

  viewAppointments(client: ClientDTO): void {
    // Navegar a lista de turnos filtrados por este cliente
    this.router.navigate(['/appointments'], {
      queryParams: { clientId: client._id }
    });
  }

  confirmDelete(client: ClientDTO): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar a "${client.fullName}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteClient(client),
    });
  }

  private deleteClient(client: ClientDTO): void {
    this.clientsApi.delete(client._id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Cliente eliminado',
          detail: `${client.fullName} ha sido eliminado`,
        });
        this.loadClients();
      },
    });
  }
}
