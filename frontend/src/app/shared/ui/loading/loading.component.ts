import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" [class.inline]="inline()">
      <div class="spinner"></div>
      @if (text()) {
        <span class="loading-text">{{ text() }}</span>
      }
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-2xl);
      gap: var(--spacing-md);

      &.inline {
        flex-direction: row;
        padding: var(--spacing-sm);
      }
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--color-border);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .loading-text {
      font-size: 0.875rem;
      color: var(--color-text-secondary);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `],
})
export class LoadingComponent {
  text = input<string>();
  inline = input(false);
}
