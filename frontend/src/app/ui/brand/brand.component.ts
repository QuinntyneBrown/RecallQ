import { Component } from '@angular/core';

@Component({
  selector: 'app-brand',
  standalone: true,
  template: `
    <div class="brand" data-testid="brand">
      <span class="dot" aria-hidden="true"></span>
      <span class="text">RecallQ</span>
    </div>
  `,
  styles: [`
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--foreground-primary);
      font-size: 18px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: linear-gradient(
        90deg,
        var(--accent-gradient-start),
        var(--accent-gradient-end)
      );
    }
  `],
})
export class BrandComponent {}
