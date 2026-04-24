import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HealthService } from '../../health.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav aria-label="Sidebar" class="sidebar">
      <span
        data-testid="health-dot-sidebar"
        class="dot"
        [class.online]="online()"
        aria-hidden="true"
      ></span>
      <a routerLink="/home" aria-label="Home"><i class="ph ph-house"></i></a>
      <a routerLink="/search" aria-label="Search"><i class="ph ph-magnifying-glass"></i></a>
      <a routerLink="/ask" aria-label="Ask"><i class="ph ph-sparkle"></i></a>
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
    .sidebar {
      width: 80px;
      height: 100%;
      background: var(--surface-primary);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px 0;
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
    a, button {
      background: transparent;
      border: 0;
      color: var(--foreground-muted);
      font-size: 24px;
      padding: 8px 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
    }
    a:hover, a:focus-visible, button:hover, button:focus-visible {
      color: var(--foreground-primary);
    }
    .profile-wrap {
      position: relative;
      margin-top: auto;
    }
    .menu {
      position: absolute;
      bottom: 0;
      left: 100%;
      background: var(--surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 4px;
      min-width: 140px;
      margin-left: 8px;
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
export class SidebarComponent {
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
