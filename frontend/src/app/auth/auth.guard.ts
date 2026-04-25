import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanMatchFn = (_route, segments) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.authState() !== null) return true;
  const path = '/' + segments.map(s => s.path).join('/');
  return router.parseUrl(`/login?returnUrl=${encodeURIComponent(path)}`);
};
