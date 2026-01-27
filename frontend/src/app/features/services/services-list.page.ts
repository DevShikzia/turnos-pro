import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { ServicesApi } from './services.api';
import { ServiceDTO } from '@shared/models/api.types';

@Component({
  selector: 'app-services-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
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
      <app-page-header title="Servicios" subtitle="Gestiona los servicios que ofreces">
        <p-button
          label="Nuevo servicio"
          icon="pi pi-plus"
          routerLink="/services/new"
        />
      </app-page-header>

      @if (loading()) {
        <app-loading text="Cargando servicios..." />
      } @else if (services().length === 0) {
        <app-empty-state
          icon="pi-list"
          title="No hay servicios"
          message="Agrega servicios que ofreces a tus clientes"
        >
          <p-button
            label="Agregar servicio"
            icon="pi pi-plus"
            routerLink="/services/new"
          />
        </app-empty-state>
      } @else {
        <div class="card">
          <p-table
            [value]="services()"
            [paginator]="true"
            [rows]="10"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th class="hide-mobile">Descripción</th>
                <th>Estado</th>
                <th style="width: 120px">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-service>
              <tr>
                <td>
                  <div class="service-info">
                    <span class="name">{{ service.name }}</span>
                  </div>
                </td>
                <td class="hide-mobile">
                  {{ service.description || '-' }}
                </td>
                <td>
                  <p-tag
                    [value]="service.isActive ? 'Activo' : 'Inactivo'"
                    [severity]="service.isActive ? 'success' : 'danger'"
                  />
                </td>
                <td>
                  <div class="actions">
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      severity="info"
                      size="small"
                      [routerLink]="['/services', service._id, 'edit']"
                      pTooltip="Editar"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      severity="danger"
                      size="small"
                      (onClick)="confirmDelete(service)"
                      pTooltip="Eliminar"
                    />
                  </div>
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
    .service-info {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .name {
        font-weight: 500;
      }

      .description {
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
export class ServicesListPage implements OnInit {
  private servicesApi = inject(ServicesApi);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  loading = signal(true);
  services = signal<ServiceDTO[]>([]);

  ngOnInit(): void {
    this.loadServices();
  }

  private loadServices(): void {
    this.servicesApi.list({ limit: 100 }).subscribe({
      next: (response) => {
        this.services.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  confirmDelete(service: ServiceDTO): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar "${service.name}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteService(service),
    });
  }

  private deleteService(service: ServiceDTO): void {
    this.servicesApi.delete(service._id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Servicio eliminado',
          detail: `${service.name} ha sido eliminado`,
        });
        this.loadServices();
      },
    });
  }
}
