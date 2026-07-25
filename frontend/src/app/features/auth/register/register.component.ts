/**
 * Register Component (Standalone)
 */

import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { environment } from '@env/environment';

declare var google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['../auth.common.css'],
})
export class RegisterComponent implements OnInit, AfterViewInit {
  registerForm!: FormGroup;
  loading = false;
  error = '';
  private googleInitialized = false;

  @ViewChild('googleSignUpButton') googleSignUpButton!: ElementRef;

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
    this.initializeGoogleSignIn();
  }

  private initializeForm(): void {
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
    this.error = '';
    const { email, username, password, firstName, lastName } = this.registerForm.value;

    this.authService.register(email, username, password, firstName, lastName).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.router.navigate(['/dashboard/editor']).then(() => {
            this.loading = false;
          });
        });
      },
      error: (error: any) => {
        this.error = error.error?.message || error.error?.error?.message || 'Registration failed';
        this.loading = false;
      },
    });
  }

  private initializeGoogleSignIn(): void {
    if (this.googleInitialized) return;

    this.waitForGoogleLibrary(() => {
      if (!this.googleSignUpButton?.nativeElement) {
        console.warn('Google Sign-Up button element not found');
        return;
      }

      try {
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleSignUp(response),
          auto_select: false, // Disable auto-select to prevent conflicts
          itp_support: true, // Support for intelligent tracking prevention
        });

        google.accounts.id.renderButton(this.googleSignUpButton.nativeElement, {
          theme: 'outline',
          size: 'large',
          text: 'signup_with',
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

  private handleGoogleSignUp(response: any): void {
    if (!response.credential) {
      this.error = 'Google sign-up failed - no credential received';
      console.error('No credential in Google response');
      return;
    }

    this.loading = true;
    this.error = '';
    console.log('Google Sign-Up initiated with token');

    this.authService.googleLogin(response.credential).subscribe({
      next: (data) => {
        console.log('Google sign-up successful:', data);
        // Run navigation inside Angular zone to ensure change detection
        this.ngZone.run(() => {
          // Add small delay to ensure all state is updated before navigation
          setTimeout(() => {
            this.router.navigate(['/dashboard/editor']).catch((err) => {
              console.error('Navigation error:', err);
              this.error = 'Sign-up successful but navigation failed';
              this.loading = false;
            });
          }, 100);
        });
      },
      error: (error: any) => {
        console.error('Google sign-up error:', error);
        const errorMessage =
          error?.error?.message ||
          error?.error?.error?.message ||
          error?.message ||
          'Google sign-up failed';
        this.error = errorMessage;
        this.loading = false;
      },
    });
  }
}
