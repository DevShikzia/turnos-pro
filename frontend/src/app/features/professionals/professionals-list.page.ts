import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { PageHeaderComponent } from '@shared/ui/page-header/page-header.component';
import { EmptyStateComponent } from '@shared/ui/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/ui/loading/loading.component';
import { ProfessionalsApi } from './professionals.api';
import { ProfessionalDTO, ServiceDTO } from '@shared/models/api.types';

@Component({
  selector: 'app-professionals-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ButtonModule,
    TableModule,
    TagModule,
    ChipModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingComponent,
  ],
  template: `
    <div class="page-container">
      <app-page-header title="Profesionales" subtitle="Gestiona tu equipo de trabajo">
        <p-button
          label="Nuevo profesional"
          icon="pi pi-plus"
          routerLink="/professionals/new"
        />
      </app-page-header>

      @if (loading()) {
        <app-loading text="Cargando profesionales..." />
      } @else if (professionals().length === 0) {
        <app-empty-state
          icon="pi-id-card"
          title="No hay profesionales"
          message="Agrega profesionales que atenderán los turnos"
        >
          <p-button
            label="Agregar profesional"
            icon="pi pi-plus"
            routerLink="/professionals/new"
          />
        </app-empty-state>
      } @else {
        <div class="card">
          <p-table
            [value]="professionals()"
            [paginator]="true"
            [rows]="10"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th class="hide-mobile">Contacto</th>
                <th>Servicios</th>
                <th>Estado</th>
                <th style="width: 120px">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-professional>
              <tr>
                <td>
                  <span class="font-medium">{{ professional.fullName }}</span>
                </td>
                <td class="hide-mobile">
                  <div class="contact-info">
                    @if (professional.email) {
                      <span><i class="pi pi-envelope"></i> {{ professional.email }}</span>
                    }
                    @if (professional.phone) {
                      <span><i class="pi pi-phone"></i> {{ professional.phone }}</span>
                    }
                    @if (!professional.email && !professional.phone) {
                      <span class="text-muted">-</span>
                    }
                  </div>
                </td>
                <td>
                  <div class="services-chips">
                    @for (service of getServices(professional); track $index) {
                      <p-chip [label]="service" styleClass="text-sm" />
                    }
                    @if (professional.services?.length === 0) {
                      <span class="text-muted">Sin servicios</span>
                    }
                  </div>
                </td>
                <td>
                  <p-tag
                    [value]="professional.isActive ? 'Activo' : 'Inactivo'"
                    [severity]="professional.isActive ? 'success' : 'danger'"
                  />
                </td>
                <td>
                  <div class="actions">
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      severity="info"
                      size="small"
                      [routerLink]="['/professionals', professional._id, 'edit']"
                      pTooltip="Editar"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      severity="danger"
                      size="small"
                      (onClick)="confirmDelete(professional)"
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
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.875rem;

      span {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);

        i {
          color: var(--color-text-muted);
          font-size: 0.75rem;
        }
      }
    }

    .services-chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-xs);
    }

    .actions {
      display: flex;
      gap: var(--spacing-xs);
    }
  `],
})
export class ProfessionalsListPage implements OnInit {
  private professionalsApi = inject(ProfessionalsApi);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  loading = signal(true);
  professionals = signal<ProfessionalDTO[]>([]);

  ngOnInit(): void {
    this.loadProfessionals();
  }

  private loadProfessionals(): void {
    this.professionalsApi.list({ limit: 100 }).subscribe({
      next: (response) => {
        this.professionals.set(response.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  getServices(professional: ProfessionalDTO): string[] {
    return professional.services
      ?.filter((s): s is ServiceDTO => typeof s === 'object')
      .map((s) => s.name) || [];
  }

  confirmDelete(professional: ProfessionalDTO): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar a "${professional.fullName}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteProfessional(professional),
    });
  }

  private deleteProfessional(professional: ProfessionalDTO): void {
    this.professionalsApi.delete(professional._id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Profesional eliminado',
          detail: `${professional.fullName} ha sido eliminado`,
        });
        this.loadProfessionals();
      },
    });
  }
}
