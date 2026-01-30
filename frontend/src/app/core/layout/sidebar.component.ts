import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { environment } from '../../../environments/environment';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminStaffOnly?: boolean;
  adminOnly?: boolean;
  /** Si está definido, es un enlace externo (turnero) en lugar de ruta interna */
  externalUrl?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()" [class.mobile]="mobile()">
      <!-- Logo -->
      <div class="sidebar-header">
        <div class="logo">
          <i class="pi pi-calendar-plus logo-icon"></i>
          @if (!collapsed()) {
            <span class="logo-text">Turnos PRO</span>
          }
        </div>
        @if (!mobile()) {
          <button class="collapse-btn" (click)="toggleCollapse.emit()">
            <i class="pi" [class.pi-angle-left]="!collapsed()" [class.pi-angle-right]="collapsed()"></i>
          </button>
        }
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        @for (item of visibleNavItems(); track item.route) {
          @if (item.externalUrl) {
            <a
              class="nav-item"
              [href]="item.externalUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i class="pi" [class]="item.icon"></i>
              @if (!collapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </a>
          } @else {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            >
              <i class="pi" [class]="item.icon"></i>
              @if (!collapsed()) {
                <span class="nav-label">{{ item.label }}</span>
              }
            </a>
          }
        }
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <a class="nav-item" routerLink="/login" (click)="logout()">
          <i class="pi pi-sign-out"></i>
          @if (!collapsed()) {
            <span class="nav-label">Cerrar sesión</span>
          }
        </a>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: var(--sidebar-width);
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      transition: width var(--transition-normal);
      z-index: 100;

      &.collapsed {
        width: var(--sidebar-collapsed-width);

        .logo-text,
        .nav-label {
          display: none;
        }

        .nav-item {
          justify-content: center;
          padding: var(--spacing-md);
        }

        .sidebar-header {
          justify-content: center;
          padding: var(--spacing-md);
        }

        .collapse-btn {
          position: absolute;
          right: -12px;
          top: 20px;
        }
      }

      &.mobile {
        width: var(--sidebar-width);
        box-shadow: var(--shadow-lg);
      }
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-lg);
      border-bottom: 1px solid var(--color-border-light);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .logo-icon {
      font-size: 1.5rem;
      color: var(--color-primary);
    }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-text);
    }

    .collapse-btn {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--color-surface-hover);
      }

      i {
        font-size: 0.75rem;
        color: var(--color-text-secondary);
      }
    }

    .sidebar-nav {
      flex: 1;
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-xs);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      padding: var(--spacing-md) var(--spacing-md);
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      text-decoration: none;
      transition: all var(--transition-fast);
      cursor: pointer;

      &:hover {
        background: var(--color-surface-hover);
        color: var(--color-text);
      }

      &.active {
        background: var(--color-primary-light);
        color: var(--color-primary);

        i {
          color: var(--color-primary);
        }
      }

      i {
        font-size: 1.125rem;
        width: 20px;
        text-align: center;
      }
    }

    .nav-label {
      font-weight: 500;
      white-space: nowrap;
    }

    .sidebar-footer {
      padding: var(--spacing-md);
      border-top: 1px solid var(--color-border-light);
    }
  `],
})
export class SidebarComponent {
  private permissionService = inject(PermissionService);

  collapsed = input(false);
  mobile = input(false);
  toggleCollapse = output<void>();

  readonly environment = environment;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi-home', route: '/dashboard' },
    ...(environment.demoMode
      ? [{ label: 'Turnero (pantalla)', icon: 'pi-desktop', route: '/turnero-external', externalUrl: environment.kioskUrl + '/screen' } as NavItem]
      : []),
    { label: 'Turnos', icon: 'pi-calendar', route: '/appointments' },
    { label: 'Clientes', icon: 'pi-users', route: '/clients' },
    { label: 'Fila', icon: 'pi-list', route: '/queue' },
    { label: 'Mis Turnos', icon: 'pi-calendar-check', route: '/professional/today' },
    { label: 'Servicios', icon: 'pi-cog', route: '/services', adminStaffOnly: true },
    { label: 'Profesionales', icon: 'pi-id-card', route: '/professionals', adminStaffOnly: true },
    { label: 'Disponibilidad', icon: 'pi-clock', route: '/availability', adminStaffOnly: true },
    { label: 'Feriados', icon: 'pi-calendar-times', route: '/holidays', adminStaffOnly: true },
    { label: 'Usuarios', icon: 'pi-user-edit', route: '/users', adminOnly: true },
  ];

  visibleNavItems = computed(() => {
    const isAdmin = this.permissionService.hasRole('admin');
    const isAdminOrStaff = this.permissionService.isAdminOrStaff();
    const isProfessional = this.permissionService.hasRole('professional');
    const isReceptionist = this.permissionService.hasRole('receptionist');

    return this.navItems.filter((item) => {
      // Enlace externo (turnero) no tiene restricciones de rol
      if (item.externalUrl) {
        return true;
      }
      // "Mis Turnos" solo para profesionales
      if (item.route === '/professional/today' && !isProfessional) {
        return false;
      }
      // "Fila" solo para recepcionistas, staff y admin
      if (item.route === '/queue' && !isReceptionist && !isAdminOrStaff) {
        return false;
      }
      if (item.adminOnly && !isAdmin) {
        return false;
      }
      if (item.adminStaffOnly && !isAdminOrStaff) {
        return false;
      }
      return true;
    });
  });

  logout(): void {
    localStorage.clear();
  }
}
