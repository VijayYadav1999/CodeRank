/**
 * App Routing Configuration
 */

import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { CodeEditorComponent } from './features/editor/code-editor/code-editor.component';
import { SubmissionsHistoryComponent } from './features/editor/submissions-history/submissions-history.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
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
];
