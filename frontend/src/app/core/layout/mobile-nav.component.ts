import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PermissionService } from '../services/permission.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminStaffOnly?: boolean;
}

@Component({
  selector: 'app-mobile-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="mobile-nav">
      @for (item of visibleNavItems(); track item.route) {
        <a
          class="nav-item"
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
        >
          <i class="pi" [class]="item.icon"></i>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      }
    </nav>
  `,
  styles: [`
    .mobile-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 70px;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
      display: flex;
      justify-content: space-around;
      align-items: center;
      padding: var(--spacing-xs) var(--spacing-sm);
      z-index: 100;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      text-decoration: none;
      transition: all var(--transition-fast);
      min-width: 60px;

      &:hover,
      &.active {
        color: var(--color-primary);
      }

      &.active {
        background: var(--color-primary-light);
      }

      i {
        font-size: 1.25rem;
      }
    }

    .nav-label {
      font-size: 0.625rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
  `],
})
export class MobileNavComponent {
  private permissionService = inject(PermissionService);

  navItems: NavItem[] = [
    { label: 'Inicio', icon: 'pi-home', route: '/dashboard' },
    { label: 'Turnos', icon: 'pi-calendar', route: '/appointments' },
    { label: 'Clientes', icon: 'pi-users', route: '/clients' },
    { label: 'Config', icon: 'pi-cog', route: '/availability', adminStaffOnly: true },
  ];

  visibleNavItems = computed(() => {
    const isAdminOrStaff = this.permissionService.isAdminOrStaff();
    return this.navItems.filter((item) => {
      if (item.adminStaffOnly && !isAdminOrStaff) {
        return false;
      }
      return true;
    });
  });
}
