import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { UsersApi } from './users.api';
import { UserDTO, Role } from '@shared/models/api.types';

@Component({
  selector: 'app-users-list',
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
      <app-page-header title="Usuarios" subtitle="Gestiona los usuarios del sistema">
        <p-button
          label="Nuevo usuario"
          icon="pi pi-plus"
          routerLink="/users/new"
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
            placeholder="Buscar por email..."
            class="w-full"
          />
        </span>
      </div>

      @if (loading()) {
        <app-loading text="Cargando usuarios..." />
      } @else if (users().length === 0 && !searchTerm) {
        <app-empty-state
          icon="pi-user"
          title="No hay usuarios"
          message="Crea el primer usuario del sistema"
        >
          <p-button
            label="Crear usuario"
            icon="pi pi-plus"
            routerLink="/users/new"
          />
        </app-empty-state>
      } @else {
        <div class="card">
          <p-table
            [value]="users()"
            [paginator]="true"
            [rows]="10"
            [rowsPerPageOptions]="[10, 25, 50]"
            [showCurrentPageReport]="true"
            currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
            [loading]="tableLoading()"
            styleClass="p-datatable-sm"
          >
            <ng-template pTemplate="header">
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th style="width: 150px">Acciones</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-user>
              <tr>
                <td>
                  <span class="font-medium">{{ user.email }}</span>
                </td>
                <td>
                  <p-tag
                    [value]="getRoleLabel(user.role)"
                    [severity]="getRoleSeverity(user.role)"
                  />
                </td>
                <td>
                  <p-tag
                    [value]="user.isActive ? 'Activo' : 'Inactivo'"
                    [severity]="user.isActive ? 'success' : 'danger'"
                  />
                </td>
                <td>
                  {{ user.lastLoginAt ? (user.lastLoginAt | date:'dd/MM/yy HH:mm') : 'Nunca' }}
                </td>
                <td>
                  <div class="actions">
                    <p-button
                      icon="pi pi-pencil"
                      [rounded]="true"
                      severity="info"
                      size="small"
                      [routerLink]="['/users', user._id || user.id, 'edit']"
                      pTooltip="Editar"
                    />
                    <p-button
                      [icon]="user.isActive ? 'pi pi-ban' : 'pi pi-check'"
                      [rounded]="true"
                      [severity]="user.isActive ? 'warning' : 'success'"
                      size="small"
                      (onClick)="toggleUserStatus(user)"
                      [pTooltip]="user.isActive ? 'Deshabilitar' : 'Habilitar'"
                    />
                    <p-button
                      icon="pi pi-trash"
                      [rounded]="true"
                      severity="danger"
                      size="small"
                      (onClick)="confirmDelete(user)"
                      pTooltip="Eliminar"
                    />
                  </div>
                </td>
              </tr>
            </ng-template>
            <ng-template pTemplate="emptymessage">
              <tr>
                <td colspan="5" class="text-center p-4">
                  No se encontraron usuarios
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

    .actions {
      display: flex;
      gap: var(--spacing-xs);
    }
  `],
})
export class UsersListPage implements OnInit {
  private usersApi = inject(UsersApi);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  loading = signal(true);
  tableLoading = signal(false);
  users = signal<UserDTO[]>([]);
  searchTerm = '';

  private searchTimeout?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.loadUsers();
  }

  private loadUsers(search?: string): void {
    this.usersApi.list({ search, limit: 100 }).subscribe({
      next: (response) => {
        this.users.set(response.data);
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
      this.loadUsers(this.searchTerm || undefined);
    }, 300);
  }

  getRoleLabel(role: Role): string {
    const labels: Record<Role, string> = {
      admin: 'Administrador',
      staff: 'Staff',
      receptionist: 'Recepcionista',
      professional: 'Profesional',
    };
    return labels[role] || role;
  }

  getRoleSeverity(role: Role): 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast' | undefined {
    const severities: Record<Role, 'success' | 'info' | 'warning' | 'danger' | 'secondary' | 'contrast'> = {
      admin: 'danger',
      staff: 'info',
      receptionist: 'secondary',
      professional: 'success',
    };
    return severities[role] || 'secondary';
  }

  toggleUserStatus(user: UserDTO): void {
    const newStatus = !user.isActive;
    const action = newStatus ? 'habilitar' : 'deshabilitar';

    this.confirmationService.confirm({
      message: `¿Estás seguro de ${action} al usuario "${user.email}"?`,
      header: `Confirmar ${action}`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: `Sí, ${action}`,
      rejectLabel: 'Cancelar',
      accept: () => {
        this.usersApi.update(user._id || user.id, { isActive: newStatus }).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: newStatus ? 'Usuario habilitado' : 'Usuario deshabilitado',
              detail: `${user.email} ha sido ${newStatus ? 'habilitado' : 'deshabilitado'}`,
            });
            this.loadUsers();
          },
        });
      },
    });
  }

  confirmDelete(user: UserDTO): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar al usuario "${user.email}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteUser(user),
    });
  }

  private deleteUser(user: UserDTO): void {
    this.usersApi.delete(user._id || user.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Usuario eliminado',
          detail: `${user.email} ha sido eliminado`,
        });
        this.loadUsers();
      },
    });
  }
}
