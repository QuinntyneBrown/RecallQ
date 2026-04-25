import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StatusBarComponent } from './ui/status-bar/status-bar.component';
import { BottomNavComponent } from './ui/bottom-nav/bottom-nav.component';
import { HomeIndicatorComponent } from './ui/home-indicator/home-indicator.component';
import { ToastHostComponent } from './ui/toast/toast.component';
import { SidebarComponent } from './ui/sidebar/sidebar.component';
import { HealthService } from './health.service';
import { BreakpointService } from './shell/breakpoint.service';
import { AuthService } from './auth/auth.service';

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
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('web');
  private readonly health = inject(HealthService);
  protected readonly breakpoints = inject(BreakpointService);
  protected readonly auth = inject(AuthService);

  ngOnInit(): void {
    this.health.start();
  }
}
