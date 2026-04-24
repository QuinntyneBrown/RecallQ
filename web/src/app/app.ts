import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StatusBarComponent } from './ui/status-bar/status-bar.component';
import { BottomNavComponent } from './ui/bottom-nav/bottom-nav.component';
import { HomeIndicatorComponent } from './ui/home-indicator/home-indicator.component';
import { ToastHostComponent } from './ui/toast/toast.component';
import { SidebarComponent } from './ui/sidebar/sidebar.component';
import { HealthService } from './health.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    StatusBarComponent,
    BottomNavComponent,
    HomeIndicatorComponent,
    ToastHostComponent,
    SidebarComponent,
  ],
  template: `
    <app-status-bar class="status"/>
    <app-sidebar class="sidebar"/>
    <main class="content"><router-outlet/></main>
    <app-bottom-nav class="bottom"/>
    <app-toast-host/>
    <app-home-indicator class="home-ind"/>
  `,
  styles: [`
    :host {
      display: grid;
      height: 100dvh;
      background: var(--surface-primary);
      color: var(--foreground-primary);
      /* XS (default, < 576px — --bp-sm): single column, bottom nav visible, sidebar hidden. */
      grid-template-columns: 1fr;
      grid-template-rows: auto 1fr auto auto;
      grid-template-areas:
        "status"
        "content"
        "bottom"
        "home-ind";
    }
    .status      { grid-area: status; }
    .content     { grid-area: content; overflow: auto; display: flex; flex-direction: column; }
    .bottom      { grid-area: bottom; }
    .home-ind    { grid-area: home-ind; }
    .sidebar     { display: none; }

    /* SM: >= --bp-sm (576px). Content column centered, max-width 560px. Bottom nav still visible. */
    @media (min-width: 576px) {
      :host {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr auto auto;
        grid-template-areas:
          "status"
          "content"
          "bottom"
          "home-ind";
      }
      .content {
        max-width: 560px;
        width: 100%;
        margin-left: auto;
        margin-right: auto;
      }
    }

    /* MD: >= --bp-md (768px). Sidebar left column replaces bottom nav. */
    @media (min-width: 768px) {
      :host {
        grid-template-columns: 80px 1fr;
        grid-template-rows: auto 1fr;
        grid-template-areas:
          "sidebar status"
          "sidebar content";
      }
      .sidebar  { display: block; grid-area: sidebar; }
      .bottom   { display: none; }
      .home-ind { display: none; }
      .content {
        max-width: 720px;
        width: 100%;
        margin-left: auto;
        margin-right: auto;
      }
    }
  `],
})
export class App implements OnInit {
  protected readonly title = signal('web');
  private readonly health = inject(HealthService);

  ngOnInit(): void {
    this.health.start();
  }
}
