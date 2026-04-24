import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StatusBarComponent } from './ui/status-bar/status-bar.component';
import { BottomNavComponent } from './ui/bottom-nav/bottom-nav.component';
import { HomeIndicatorComponent } from './ui/home-indicator/home-indicator.component';
import { HealthService } from './health.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, StatusBarComponent, BottomNavComponent, HomeIndicatorComponent],
  template: `
    <app-status-bar/>
    <main class="content"><router-outlet/></main>
    <app-bottom-nav/>
    <app-home-indicator/>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      background: var(--surface-primary);
      color: var(--foreground-primary);
    }
    .content {
      flex: 1 1 auto;
      overflow: auto;
      display: flex;
      flex-direction: column;
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
