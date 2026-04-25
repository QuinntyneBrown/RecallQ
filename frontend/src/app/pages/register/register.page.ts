import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InputFieldComponent } from '../../ui/input-field/input-field.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import { BrandComponent } from '../../ui/brand/brand.component';
import { AuthService } from '../../auth/auth.service';
import { safeReturnUrl } from '../../auth/return-url';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: 'Please enter a valid email address.',
  weak_password: 'Password must be at least 12 characters and include both letters and digits.',
  email_taken: 'An account with this email already exists.',
  register_failed: 'We could not create your account. Please try again.',
};

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [InputFieldComponent, ButtonPrimaryComponent, BrandComponent, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.css',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
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
      const target = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
      await this.router.navigateByUrl(target);
    } catch (e: any) {
      const code = e?.message ?? 'register_failed';
      this.error.set(ERROR_MESSAGES[code] ?? ERROR_MESSAGES['register_failed']);
    } finally {
      this.busy.set(false);
    }
  }
}
