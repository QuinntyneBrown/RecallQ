import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-zero-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="zero" data-testid="zero-state">
      <i class="ph ph-magnifying-glass icon" aria-hidden="true"></i>
      <h2 class="head">No contacts matched</h2>
      <p class="body">Try a different query or open Ask mode.</p>
      <a routerLink="/ask" class="link">Open Ask mode</a>
    </div>
  `,
  styles: [`
    .zero {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 48px 24px;
      gap: 12px;
      color: var(--foreground-secondary);
    }
    .icon { font-size: 40px; color: var(--foreground-muted); }
    .head { margin: 0; color: var(--foreground-primary); font-size: 18px; font-weight: 600; }
    .body { margin: 0; color: var(--foreground-secondary); font-size: 14px; }
    .link { color: var(--accent-primary); text-decoration: none; font-weight: 600; }
  `],
})
export class ZeroStateComponent {}
