import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HealthService } from '../../health.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  template: `
    <nav aria-label="Main" class="bottom-nav">
      <span
        data-testid="health-dot"
        class="dot"
        [class.online]="online()"
        aria-hidden="true"
      ></span>
      <button type="button" aria-label="Home"><i class="ph ph-house"></i></button>
      <button type="button" aria-label="Search"><i class="ph ph-magnifying-glass"></i></button>
      <button type="button" aria-label="Ask"><i class="ph ph-sparkle"></i></button>
      <div class="profile-wrap">
        <button type="button" aria-label="Profile" (click)="toggleMenu()"><i class="ph ph-user"></i></button>
        @if (menuOpen()) {
          <div role="menu" class="menu">
            <button role="menuitem" aria-label="Log out" type="button" (click)="logout()">Log out</button>
          </div>
        }
      </div>
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
      position: relative;
    }
    .dot {
      position: absolute;
      top: 8px;
      left: 12px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: transparent;
      display: inline-block;
    }
    .dot.online {
      background: var(--success);
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
    .profile-wrap {
      position: relative;
    }
    .menu {
      position: absolute;
      bottom: 100%;
      right: 0;
      background: var(--surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 4px;
      min-width: 140px;
      margin-bottom: 8px;
    }
    .menu button {
      font-size: 14px;
      width: 100%;
      justify-content: flex-start;
      padding: 8px 12px;
      color: var(--foreground-primary);
    }
  `],
})
export class BottomNavComponent {
  readonly online = inject(HealthService).online;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly menuOpen = signal(false);

  toggleMenu() { this.menuOpen.update(v => !v); }

  async logout() {
    this.menuOpen.set(false);
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
