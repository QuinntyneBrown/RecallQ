import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { Router, provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './auth/auth.service';
import { installApiInterceptor } from './auth/api-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      const router = inject(Router);
      installApiInterceptor(() => {
        auth.authState.set(null);
        void router.navigateByUrl('/login');
      });
      return auth.bootstrap();
    }),
  ]
};
