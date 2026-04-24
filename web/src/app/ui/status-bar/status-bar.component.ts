import { Component } from '@angular/core';

@Component({
  selector: 'app-status-bar',
  standalone: true,
  template: `<div data-testid="status-bar" class="status-bar"><span class="clock">9:41</span></div>`,
  styles: [`
    .status-bar {
      height: 50px;
      background: var(--surface-primary);
      color: var(--foreground-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .clock {
      font-weight: 600;
      font-size: 17px;
    }
  `],
})
export class StatusBarComponent {}
