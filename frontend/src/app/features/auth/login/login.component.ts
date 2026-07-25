/**
 * Login Component (Standalone)
 */

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

declare var google: any;

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['../auth.common.css'],
})
export class LoginComponent implements OnInit, AfterViewInit {
  @ViewChild('googleSignInButton') googleSignInButton!: ElementRef;

  loginForm!: FormGroup;
  loading = false;
  error = '';
  private googleInitialized = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  ngAfterViewInit(): void {
    // Initialize Google Sign-In after view is ready
    this.initializeGoogleSignIn();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private initializeGoogleSignIn(): void {
    // Prevent multiple initializations
    if (this.googleInitialized) return;

    this.waitForGoogleLibrary(() => {
      if (!this.googleSignInButton?.nativeElement) {
        console.warn('Google Sign-In button element not found');
        return;
      }

      try {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleSignIn(response),
          auto_select: false, // Disable auto-select to prevent conflicts
          itp_support: true, // Support for intelligent tracking prevention
        });

        google.accounts.id.renderButton(this.googleSignInButton.nativeElement, {
          theme: 'outline',
          size: 'large',
          width: '300',
        });
        this.googleInitialized = true;
      } catch (error) {
        console.error('Failed to initialize Google Sign-In:', error);
        this.error = 'Failed to initialize Google authentication';
      }
    });
  }

  private waitForGoogleLibrary(callback: () => void, attempts = 0): void {
    const maxAttempts = 100; // 10 seconds max (100 * 100ms)

    if (attempts > maxAttempts) {
      console.error('Google Sign-In library failed to load after 10 seconds');
      this.error = 'Google authentication library failed to load';
      return;
    }

    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      callback();
    } else {
      setTimeout(() => {
        this.waitForGoogleLibrary(callback, attempts + 1);
      }, 100);
    }
  }

  private handleGoogleSignIn(response: any): void {
    if (!response.credential) {
      this.error = 'Google sign-in failed - no credential received';
      console.error('No credential in Google response');
      return;
    }

    this.loading = true;
    this.error = '';
    console.log('Google Sign-In initiated with token');

    this.authService.googleLogin(response.credential).subscribe({
      next: (data) => {
        console.log('Google sign-in successful:', data);
        // Run navigation inside Angular zone to ensure change detection
        this.ngZone.run(() => {
          // Add small delay to ensure all state is updated before navigation
          setTimeout(() => {
            this.router.navigate(['/dashboard/editor']).catch((err) => {
              console.error('Navigation error:', err);
              this.error = 'Sign-in successful but navigation failed';
              this.loading = false;
            });
          }, 100);
        });
      },
      error: (error: any) => {
        console.error('Google sign-in error:', error);
        const errorMessage =
          error?.error?.message ||
          error?.error?.error?.message ||
          error?.message ||
          'Google sign-in failed';
        this.error = errorMessage;
        this.loading = false;
      },
    });
  }

  onSubmit(): void {
    if (!this.loginForm.valid) return;

    this.loading = true;
    this.error = '';
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.router.navigate(['/dashboard/editor']).then(() => {
            this.loading = false;
          });
        });
      },
      error: (error: any) => {
        this.error = error.error?.message || error.error?.error?.message || 'Login failed';
        this.loading = false;
      },
    });
  }
}
