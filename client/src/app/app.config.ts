import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // Router with View Transitions (smooth navigation) and Input Binding (params as inputs)
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    
    // HTTP with Auth Interceptor & Fetch API
    provideHttpClient(withInterceptors([authInterceptor]), withFetch()),

  ]
};