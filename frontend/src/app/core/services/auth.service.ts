/**
 * Authentication Service
 * Manages user authentication state and API calls
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

  constructor(private http: HttpClient) {
    this.loadUser();
  }

  register(
    email: string,
    username: string,
    password: string,
    firstName: string,
    lastName: string,
  ): Observable<AuthData> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      email,
      username,
      password,
      firstName,
      lastName,
    }).pipe(
      map((response: AuthResponse) => {
        const { user, token } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return { user, token };
      }),
    );
  }

  login(email: string, password: string): Observable<AuthData> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password,
    }).pipe(
      map((response: AuthResponse) => {
        console.log('[AuthService] Full response:', response);
        console.log('[AuthService] Response data:', response.data);
        const { user, token } = response.data;
        console.log('[AuthService] Token:', token);
        console.log('[AuthService] User:', user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return { user, token };
      }),
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private loadUser(): void {
    try {
      const user = localStorage.getItem('user');
      if (user && user !== 'undefined') {
        this.currentUserSubject.next(JSON.parse(user));
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem('user');
    }
  }
}
