import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InputFieldComponent } from '../../ui/input-field/input-field.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [InputFieldComponent, ButtonPrimaryComponent, RouterLink],
  template: `
    <section class="page">
      <h1>Sign in</h1>
      <form (submit)="onSubmit($event)">
        <app-input-field
          label="Email"
          type="email"
          name="email"
          autocomplete="email"
          [value]="email()"
          (valueChange)="email.set($event)"
        />
        <app-input-field
          label="Password"
          type="password"
          name="password"
          autocomplete="current-password"
          [value]="password()"
          (valueChange)="password.set($event)"
        />
        @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
        <app-button-primary type="submit" [disabled]="busy()">Sign in</app-button-primary>
      </form>
      <a class="alt" routerLink="/register">Create account</a>
    </section>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
      max-width: 390px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    h1 {
      color: var(--foreground-primary);
      font-size: 28px;
      margin: 0;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .err {
      color: var(--accent-secondary);
      font-size: 14px;
    }
    .alt {
      color: var(--accent-tertiary);
      text-decoration: none;
      font-size: 14px;
      text-align: center;
    }
  `],
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly email = signal('');
  readonly password = signal('');
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  async onSubmit(ev: Event) {
    ev.preventDefault();
    this.error.set(null);
    this.busy.set(true);
    try {
      await this.auth.login(this.email(), this.password());
      await this.router.navigateByUrl('/home');
    } catch (e: any) {
      this.error.set(e?.message ?? 'error');
    } finally {
      this.busy.set(false);
    }
  }
}
