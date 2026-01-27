import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-card" [class]="'stats-card--' + color()">
      <div class="stats-icon">
        <i class="pi" [class]="icon()"></i>
      </div>
      <div class="stats-content">
        <span class="stats-value">{{ value() }}</span>
        <span class="stats-label">{{ label() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .stats-card {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      border: 1px solid var(--color-border-light);
      transition: all var(--transition-fast);

      &:hover {
        box-shadow: var(--shadow-md);
      }
    }

    .stats-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;

      i {
        font-size: 1.25rem;
      }
    }

    .stats-card--primary .stats-icon {
      background: var(--color-primary-light);
      i { color: var(--color-primary); }
    }

    .stats-card--success .stats-icon {
      background: var(--color-success-light);
      i { color: var(--color-success); }
    }

    .stats-card--warning .stats-icon {
      background: var(--color-warning-light);
      i { color: var(--color-warning); }
    }

    .stats-card--danger .stats-icon {
      background: var(--color-danger-light);
      i { color: var(--color-danger); }
    }

    .stats-card--info .stats-icon {
      background: var(--color-info-light);
      i { color: var(--color-info); }
    }

    .stats-content {
      display: flex;
      flex-direction: column;
    }

    .stats-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1;
    }

    .stats-label {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
      margin-top: var(--spacing-xs);
    }
  `],
})
export class StatsCardComponent {
  value = input.required<string | number>();
  label = input.required<string>();
  icon = input('pi-chart-bar');
  color = input<'primary' | 'success' | 'warning' | 'danger' | 'info'>('primary');
}
