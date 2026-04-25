import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideHttpClient, withInterceptors, HttpInterceptorFn } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { catchError } from 'rxjs';

import { routes } from './app.routes';
import { AuthService } from './auth/auth.service';

const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && isProtectedApi(req.url)) {
        auth.authState.set(null);
        const url = router.url;
        const usable = url && url !== '/' && !url.startsWith('/login');
        const target = usable ? `/login?returnUrl=${encodeURIComponent(url)}` : '/login';
        void router.navigateByUrl(target);
      }
      throw error;
    })
  );
};

function isProtectedApi(url: string): boolean {
  const path = url.startsWith('http') ? new URL(url).pathname : url;
  if (!path.startsWith('/api/')) return false;
  if (path.startsWith('/api/auth/')) return false;
  if (path.startsWith('/api/ping')) return false;
  return true;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiInterceptor])),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.bootstrap();
    }),
  ]
};
