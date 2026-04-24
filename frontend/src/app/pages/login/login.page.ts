import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { InputFieldComponent } from '../../ui/input-field/input-field.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import { BrandComponent } from '../../ui/brand/brand.component';
import { AuthService } from '../../auth/auth.service';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email or password is incorrect.',
  rate_limited: 'Too many attempts. Try again in a minute.',
  login_failed: 'We could not sign you in. Please try again.',
};

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [InputFieldComponent, ButtonPrimaryComponent, BrandComponent, RouterLink],
  template: `
    <section class="page">
      <app-brand/>
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
      <p class="aux">
        Don't have an account?
        <a routerLink="/register">Create one</a>
      </p>
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
    .aux {
      color: var(--foreground-secondary);
      font-size: 14px;
      text-align: center;
      margin: 0;
    }
    .aux a {
      color: var(--accent-tertiary);
      text-decoration: none;
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
      const code = e?.message ?? 'login_failed';
      this.error.set(ERROR_MESSAGES[code] ?? ERROR_MESSAGES['login_failed']);
    } finally {
      this.busy.set(false);
    }
  }
}
