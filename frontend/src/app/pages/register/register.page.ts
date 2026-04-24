import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { InputFieldComponent } from '../../ui/input-field/input-field.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [InputFieldComponent, ButtonPrimaryComponent],
  template: `
    <section class="page">
      <h1>Create account</h1>
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
          autocomplete="new-password"
          [value]="password()"
          (valueChange)="password.set($event)"
        />
        @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
        <app-button-primary type="submit" [disabled]="busy()">Create account</app-button-primary>
      </form>
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
  `],
})
export class RegisterPage {
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
      await this.auth.register(this.email(), this.password());
      await this.router.navigateByUrl('/home');
    } catch (e: any) {
      this.error.set(e?.message ?? 'error');
    } finally {
      this.busy.set(false);
    }
  }
}
