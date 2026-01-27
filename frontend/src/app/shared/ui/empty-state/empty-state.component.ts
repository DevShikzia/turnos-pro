import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        <i class="pi" [class]="icon()"></i>
      </div>
      <h3 class="empty-title">{{ title() }}</h3>
      @if (message()) {
        <p class="empty-message">{{ message() }}</p>
      }
      <div class="empty-actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl);
      text-align: center;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      border-radius: var(--radius-full);
      background: var(--color-bg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--spacing-lg);

      i {
        font-size: 2rem;
        color: var(--color-text-muted);
      }
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-text);
      margin: 0 0 var(--spacing-xs);
    }

    .empty-message {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin: 0 0 var(--spacing-lg);
      max-width: 300px;
    }

    .empty-actions {
      display: flex;
      gap: var(--spacing-sm);
    }
  `],
})
export class EmptyStateComponent {
  icon = input('pi-inbox');
  title = input.required<string>();
  message = input<string>();
}
