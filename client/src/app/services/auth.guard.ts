import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.auth.isLoggedIn()) {
      return true;
    }

    // Safely capture the return URL to redirect the user back after login
    const returnUrl = state.url.startsWith('/') && !state.url.startsWith('//') ? state.url : '/';

    return this.router.createUrlTree(['/login'], {
      queryParams: { returnUrl }
    });
  }
}