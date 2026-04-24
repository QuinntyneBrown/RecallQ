import { Component } from '@angular/core';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  template: `
    <nav aria-label="Main" class="bottom-nav">
      <button type="button" aria-label="Home"><i class="ph ph-house"></i></button>
      <button type="button" aria-label="Search"><i class="ph ph-magnifying-glass"></i></button>
      <button type="button" aria-label="Ask"><i class="ph ph-sparkle"></i></button>
      <button type="button" aria-label="You"><i class="ph ph-user"></i></button>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      height: 80px;
      background: var(--surface-primary);
      display: flex;
      align-items: center;
      justify-content: space-around;
      border-top: 1px solid var(--border-subtle);
    }
    button {
      background: transparent;
      border: 0;
      color: var(--foreground-muted);
      font-size: 24px;
      padding: 8px 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    button:hover, button:focus-visible {
      color: var(--foreground-primary);
    }
  `],
})
export class BottomNavComponent {}
