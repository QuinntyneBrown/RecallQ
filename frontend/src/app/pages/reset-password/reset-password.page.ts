import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { BrandComponent } from '../../ui/brand/brand.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import { ToastService } from '../../ui/toast/toast.service';

const ERROR_MESSAGES: Record<string, string> = {
  weak_password: 'Password must be at least 12 characters with letters and digits.',
  rate_limited: 'Too many attempts. Try again in a minute.',
  reset_failed: 'We could not update your password. Please try again.',
};

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [BrandComponent, ButtonPrimaryComponent, RouterLink],
  templateUrl: './reset-password.page.html',
  styleUrl: './reset-password.page.css',
})
export class ResetPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly token = signal(this.route.snapshot.queryParamMap.get('token')?.trim() || null);
  readonly password = signal('');
  readonly confirm = signal('');
  readonly show = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly invalidLink = signal(this.token() === null);

  readonly passwordType = computed(() => this.show() ? 'text' : 'password');
  readonly passwordsMismatch = computed(() => this.confirm().length > 0 && this.password() !== this.confirm());
  readonly passwordMeetsPolicy = computed(() =>
    this.password().length >= 12 && /[a-zA-Z]/.test(this.password()) && /\d/.test(this.password()));
  readonly valid = computed(() => this.passwordMeetsPolicy() && this.password() === this.confirm());

  toggleShow() {
    this.show.update((value) => !value);
  }

  onInput(target: 'password' | 'confirm', ev: Event) {
    const value = (ev.target as HTMLInputElement).value;
    if (target === 'password') this.password.set(value);
    else this.confirm.set(value);
  }

  async onSubmit(ev: Event) {
    ev.preventDefault();
    this.error.set(null);
    if (!this.token()) {
      this.invalidLink.set(true);
      return;
    }
    if (!this.valid()) {
      this.error.set(this.passwordsMismatch()
        ? 'Passwords must match.'
        : ERROR_MESSAGES['weak_password']);
      return;
    }

    this.busy.set(true);
    try {
      await this.auth.resetPassword(this.token()!, this.password());
      this.toast.show('Password updated. Please sign in.');
      await this.router.navigateByUrl('/login');
    } catch (e: any) {
      const code = e?.message ?? 'reset_failed';
      if (code === 'invalid_token') {
        this.invalidLink.set(true);
      } else {
        this.error.set(ERROR_MESSAGES[code] ?? ERROR_MESSAGES['reset_failed']);
      }
    } finally {
      this.busy.set(false);
    }
  }
}
