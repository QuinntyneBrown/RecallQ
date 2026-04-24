import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './auth/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.bootstrap();
    }),
  ]
};
