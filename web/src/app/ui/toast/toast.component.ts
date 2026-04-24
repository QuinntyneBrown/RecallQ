import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="toast-host" role="status" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast">{{ t.text }}</div>
      }
    </div>
  `,
  styles: [`
    .toast-host {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 96px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      pointer-events: none;
      z-index: 50;
    }
    .toast {
      background: var(--surface-elevated);
      color: var(--foreground-primary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 10px 16px;
      font-size: 14px;
      box-shadow: var(--shadow-md, 0 4px 12px rgba(0,0,0,0.18));
      pointer-events: auto;
    }
  `],
})
export class ToastHostComponent {
  readonly toasts = inject(ToastService);
}
