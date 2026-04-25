import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { BrandComponent } from '../../ui/brand/brand.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import { InputFieldComponent } from '../../ui/input-field/input-field.component';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: 'Please enter a valid email address.',
  rate_limited: 'Too many requests. Try again in a minute.',
  forgot_failed: 'We could not send a reset link. Please try again.',
};

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [BrandComponent, ButtonPrimaryComponent, InputFieldComponent, RouterLink],
  templateUrl: './forgot-password.page.html',
  styleUrl: './forgot-password.page.css',
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly email = signal(this.route.snapshot.queryParamMap.get('email') ?? '');
  readonly submittedEmail = signal('');
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly submitted = signal(false);

  async onSubmit(ev: Event) {
    ev.preventDefault();
    this.error.set(null);
    this.busy.set(true);
    try {
      const email = this.email().trim();
      await this.auth.requestPasswordReset(email);
      this.submittedEmail.set(email);
      this.submitted.set(true);
    } catch (e: any) {
      const code = e?.message ?? 'forgot_failed';
      this.error.set(ERROR_MESSAGES[code] ?? ERROR_MESSAGES['forgot_failed']);
    } finally {
      this.busy.set(false);
    }
  }
}
