import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InputFieldComponent } from '../../ui/input-field/input-field.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import { BrandComponent } from '../../ui/brand/brand.component';
import { CheckboxComponent } from '../../ui/checkbox/checkbox.component';
import { AuthService } from '../../auth/auth.service';
import { safeReturnUrl } from '../../auth/return-url';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email or password is incorrect.',
  rate_limited: 'Too many attempts. Try again in a minute.',
  login_failed: 'We could not sign you in. Please try again.',
};

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [InputFieldComponent, ButtonPrimaryComponent, BrandComponent, CheckboxComponent, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly email = signal('');
  readonly password = signal('');
  readonly rememberMe = signal(false);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  async onSubmit(ev: Event) {
    ev.preventDefault();
    this.error.set(null);
    this.busy.set(true);
    try {
      await this.auth.login(this.email(), this.password(), this.rememberMe());
      const target = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
      await this.router.navigateByUrl(target);
    } catch (e: any) {
      const code = e?.message ?? 'login_failed';
      this.error.set(ERROR_MESSAGES[code] ?? ERROR_MESSAGES['login_failed']);
    } finally {
      this.busy.set(false);
    }
  }
}
