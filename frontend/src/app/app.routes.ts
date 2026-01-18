/**
 * App Routing Configuration
 */

import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { CodeEditorComponent } from './features/editor/code-editor/code-editor.component';

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
    canActivate: [AuthGuard],
    children: [
      { path: 'editor', component: CodeEditorComponent },
      { path: '', redirectTo: 'editor', pathMatch: 'full' },
    ],
  },
];
