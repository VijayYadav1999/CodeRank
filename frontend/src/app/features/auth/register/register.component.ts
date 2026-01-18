/**
 * Register Component (Standalone)
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="register-container">
      <div class="register-card">
        <h1>CodeRank</h1>
        <h2>Create Account</h2>
        
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              formControlName="firstName"
              placeholder="Enter your first name"
            />
            <span class="error" *ngIf="registerForm.get('firstName')?.hasError('required')">
              First name is required
            </span>
          </div>

          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              formControlName="lastName"
              placeholder="Enter your last name"
            />
            <span class="error" *ngIf="registerForm.get('lastName')?.hasError('required')">
              Last name is required
            </span>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              placeholder="Enter your email"
            />
            <span class="error" *ngIf="registerForm.get('email')?.hasError('required')">
              Email is required
            </span>
            <span class="error" *ngIf="registerForm.get('email')?.hasError('email')">
              Please enter a valid email
            </span>
          </div>

          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              formControlName="username"
              placeholder="Choose a username"
            />
            <span class="error" *ngIf="registerForm.get('username')?.hasError('required')">
              Username is required
            </span>
            <span class="error" *ngIf="registerForm.get('username')?.hasError('minlength')">
              Username must be at least 3 characters
            </span>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              placeholder="Enter your password"
            />
            <span class="error" *ngIf="registerForm.get('password')?.hasError('required')">
              Password is required
            </span>
            <span class="error" *ngIf="registerForm.get('password')?.hasError('minlength')">
              Password must be at least 6 characters
            </span>
          </div>

          <button type="submit" [disabled]="!registerForm.valid || loading">
            {{ loading ? 'Creating Account...' : 'Sign Up' }}
          </button>

          <p class="error" *ngIf="error">{{ error }}</p>
        </form>

        <p class="login-link">
          Already have an account? <a routerLink="/auth/login">Login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .register-card {
      background: white;
      padding: 40px;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 450px;
    }

    h1 {
      color: #667eea;
      text-align: center;
      margin-bottom: 10px;
    }

    h2 {
      color: #333;
      text-align: center;
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }

    input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 14px;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    button {
      width: 100%;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.3s;
    }

    button:hover:not(:disabled) {
      background: #5568d3;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .error {
      color: #e74c3c;
      font-size: 12px;
      margin-top: 5px;
    }

    .login-link {
      text-align: center;
      margin-top: 20px;
      color: #666;
    }

    .login-link a {
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
    }

    .login-link a:hover {
      text-decoration: underline;
    }
  `],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.registerForm = this.formBuilder.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (!this.registerForm.valid) return;

    this.loading = true;
    const { email, username, password, firstName, lastName } = this.registerForm.value;

    this.authService.register(email, username, password, firstName, lastName).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        this.error = error.error?.message || 'Registration failed';
        this.loading = false;
      },
    });
  }
}
