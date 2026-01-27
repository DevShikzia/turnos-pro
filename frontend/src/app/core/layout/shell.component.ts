import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { TopbarComponent } from './topbar.component';
import { MobileNavComponent } from './mobile-nav.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent, MobileNavComponent],
  template: `
    <div class="shell" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar (Desktop) -->
      <app-sidebar
        class="hide-mobile"
        [collapsed]="sidebarCollapsed()"
        (toggleCollapse)="toggleSidebar()"
      />

      <!-- Main Content -->
      <div class="main-wrapper">
        <!-- Topbar -->
        <app-topbar
          (toggleSidebar)="toggleSidebar()"
          (toggleMobileMenu)="toggleMobileMenu()"
        />

        <!-- Page Content -->
        <main class="main-content">
          <router-outlet />
        </main>
      </div>

      <!-- Mobile Navigation -->
      <app-mobile-nav class="hide-desktop" />

      <!-- Mobile Menu Overlay -->
      @if (mobileMenuOpen()) {
        <div class="mobile-overlay" (click)="toggleMobileMenu()">
          <app-sidebar [collapsed]="false" [mobile]="true" />
        </div>
      }
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
      background: var(--color-bg);
    }

    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: var(--sidebar-width);
      transition: margin-left var(--transition-normal);

      @media (max-width: 768px) {
        margin-left: 0;
      }
    }

    .sidebar-collapsed .main-wrapper {
      margin-left: var(--sidebar-collapsed-width);

      @media (max-width: 768px) {
        margin-left: 0;
      }
    }

    .main-content {
      flex: 1;
      padding: var(--spacing-lg);
      padding-bottom: calc(var(--spacing-lg) + 70px);
      overflow-y: auto;

      @media (max-width: 768px) {
        padding: var(--spacing-md);
        padding-bottom: calc(var(--spacing-md) + 80px);
      }
    }

    .mobile-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      animation: fadeIn var(--transition-fast);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
})
export class ShellComponent {
  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }
}
