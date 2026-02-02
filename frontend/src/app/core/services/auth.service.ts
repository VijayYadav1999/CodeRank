/**
 * Authentication Service
 * Manages user authentication state and API calls with 2-day cookie persistence
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface AuthData {
  user: User;
  token: string;
}

export interface AuthResponse {
  success: boolean;
  data: AuthData;
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly COOKIE_EXPIRY_DAYS = 2;

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  /**
   * Set cookies for 2 days using native browser API
   */
  private setCookies(token: string, user: User): void {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.COOKIE_EXPIRY_DAYS);
    const expiryString = expiryDate.toUTCString();

    document.cookie = `${this.TOKEN_KEY}=${encodeURIComponent(token)}; expires=${expiryString}; path=/`;
    document.cookie = `${this.USER_KEY}=${encodeURIComponent(JSON.stringify(user))}; expires=${expiryString}; path=/`;
  }

  /**
   * Get cookie value by name
   */
  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  }

  /**
   * Get token from cookie or localStorage
   */
  private getTokenFromStorage(): string | null {
    return this.getCookie(this.TOKEN_KEY) || localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Remove all auth data
   */
  private clearAllStorage(): void {
    document.cookie = `${this.TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    document.cookie = `${this.USER_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  register(
    email: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string
  ): Observable<AuthData> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, {
        email,
        username,
        password,
        firstName,
        lastName,
      })
      .pipe(
        map((response: AuthResponse) => {
          const { user, token } = response.data;
          this.setCookies(token, user);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return { user, token };
        })
      );
  }

  login(email: string, password: string): Observable<AuthData> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, {
        email,
        password,
      })
      .pipe(
        map((response: AuthResponse) => {
          const { user, token } = response.data;
          this.setCookies(token, user);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return { user, token };
        })
      );
  }

  googleLogin(googleToken: string): Observable<AuthData> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/google`, {
        googleToken,
      })
      .pipe(
        map((response: AuthResponse) => {
          const { user, token } = response.data;
          this.setCookies(token, user);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUserSubject.next(user);
          return { user, token };
        })
      );
  }

  logout(): void {
    this.clearAllStorage();
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return this.getTokenFromStorage();
  }

  /**
   * Get current user as observable
   */
  getCurrentUser(): Observable<User | null> {
    return this.currentUser$;
  }

  /**
   * Get current user synchronously (for dashboard)
   */
  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Load user from cookies or localStorage
   */
  private loadUser(): void {
    try {
      // Try to get from cookie first
      let user = this.getCookie(this.USER_KEY);

      // Fallback to localStorage
      if (!user) {
        user = localStorage.getItem(this.USER_KEY);
      }

      if (user && user !== 'undefined') {
        this.currentUserSubject.next(JSON.parse(user));
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      this.clearAllStorage();
    }
  }
}
