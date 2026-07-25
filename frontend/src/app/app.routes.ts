/**
 * App Routing Configuration
 */

import { Routes, Router } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { CodeEditorComponent } from './features/editor/code-editor/code-editor.component';
import { SubmissionsHistoryComponent } from './features/editor/submissions-history/submissions-history.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

// Guard to redirect authenticated users from login page
@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard/editor']);
      return false;
    }
    return true;
  }
}

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent, canActivate: [NoAuthGuard] },
      { path: 'register', component: RegisterComponent, canActivate: [NoAuthGuard] },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'editor', component: CodeEditorComponent },
      { path: 'history', component: SubmissionsHistoryComponent },
      { path: '', redirectTo: 'editor', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'auth/login', pathMatch: 'full' },
];
