import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="header-actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--spacing-lg);
      gap: var(--spacing-md);

      @media (max-width: 640px) {
        flex-direction: column;
      }
    }

    .header-content {
      flex: 1;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text);
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: var(--spacing-xs) 0 0;
    }

    .header-actions {
      display: flex;
      gap: var(--spacing-sm);
      flex-shrink: 0;

      @media (max-width: 640px) {
        width: 100%;
        
        ::ng-deep button {
          flex: 1;
        }
      }
    }
  `],
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
}
