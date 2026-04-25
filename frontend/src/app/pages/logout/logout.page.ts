import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-logout-page',
  standalone: true,
  templateUrl: './logout.page.html',
  styleUrl: './logout.page.css',
})
export class LogoutPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  async ngOnInit() {
    await this.auth.logout();
    await this.router.navigateByUrl('/login');
  }
}
