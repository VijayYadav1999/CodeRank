/**
 * Authentication Guard
 */

import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check token first
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // If token exists, check user synchronously first
    let user = this.authService.getCurrentUserSync();

    // If user not immediately available, try to load from storage
    if (!user) {
      // Give it a moment for user data to load from storage
      setTimeout(() => {
        user = this.authService.getCurrentUserSync();
        if (!user) {
          this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
        }
      }, 10);
      // Allow navigation to proceed - user will load
      return true;
    }

    return true;
  }
}
