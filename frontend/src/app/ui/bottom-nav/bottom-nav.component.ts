import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HealthService } from '../../health.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.css',
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
