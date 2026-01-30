import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StorageService } from '../services/storage.service';
import { UserDTO } from '@shared/models/api.types';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <!-- Mobile Menu Button -->
      <button class="menu-btn hide-desktop" (click)="toggleMobileMenu.emit()">
        <i class="pi pi-bars"></i>
      </button>

      <!-- Desktop Toggle -->
      <button class="menu-btn hide-mobile" (click)="toggleSidebar.emit()">
        <i class="pi pi-bars"></i>
      </button>

      <!-- Spacer -->
      <div class="flex-1"></div>

      @if (environment.demoMode) {
        <span class="demo-badge">Modo demo</span>
      }

      <!-- User Info -->
      <div class="user-info">
        <div class="user-avatar">
          <i class="pi pi-user"></i>
        </div>
        <div class="user-details hide-mobile">
          <span class="user-email">{{ user?.email }}</span>
          <span class="user-role">
            {{
              user?.role === 'admin' ? 'Administrador' :
              user?.role === 'staff' ? 'Staff' :
              user?.role === 'receptionist' ? 'Recepcionista' :
              user?.role === 'professional' ? 'Profesional' :
              user?.role
            }}
          </span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: var(--topbar-height);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      padding: 0 var(--spacing-lg);
      gap: var(--spacing-md);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .menu-btn {
      background: none;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--transition-fast);

      &:hover {
        background: var(--color-surface-hover);
      }

      i {
        font-size: 1.25rem;
        color: var(--color-text-secondary);
      }
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      background: var(--color-primary-light);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        color: var(--color-primary);
        font-size: 1rem;
      }
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-email {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text);
    }

    .user-role {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .demo-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      background: linear-gradient(90deg, #6366f1, #8b5cf6);
      padding: 4px 10px;
      border-radius: var(--radius-md);
      margin-right: var(--spacing-sm);
    }
  `],
})
export class TopbarComponent {
  private storage = inject(StorageService);
  readonly environment = environment;

  toggleSidebar = output<void>();
  toggleMobileMenu = output<void>();

  get user(): UserDTO | null {
    return this.storage.getUser<UserDTO>();
  }
}
