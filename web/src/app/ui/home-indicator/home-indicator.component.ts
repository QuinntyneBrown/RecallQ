import { Component } from '@angular/core';

@Component({
  selector: 'app-home-indicator',
  standalone: true,
  template: `<div data-testid="home-indicator" class="home-indicator"><span class="pill"></span></div>`,
  styles: [`
    .home-indicator {
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-primary);
    }
    .pill {
      width: 140px;
      height: 5px;
      border-radius: var(--radius-full);
      background: var(--foreground-primary);
      display: block;
    }
  `],
})
export class HomeIndicatorComponent {}
