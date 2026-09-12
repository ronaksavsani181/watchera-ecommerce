import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { AuthResponse, User } from '../models/auth.models';
import { catchError, tap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  
  private apiUrl = `${environment.apiUrl}/auth`;
  private isBrowser = isPlatformBrowser(this.platformId);

  // State Signals
  private currentUserSig = signal<User | null>(this.getUserFromStorage());
  private showPopupSig = signal<boolean>(false);

  // Computed signals
  currentUser = computed(() => this.currentUserSig());
  isLoggedIn = computed(() => !!this.currentUserSig());
  showAuthPopup = computed(() => this.showPopupSig());

  // --- Popup Management ---
  openPopup() {
    this.showPopupSig.set(true);
  }

  closePopup() {
    this.showPopupSig.set(false);
  }

  // --- Auth Actions ---
  login(credentials: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError(this.handleError)
    );
  }

  resetPassword(payload: { email: string; password: string }) {
    return this.http
      .post<{ success: boolean; message: string }>(`${this.apiUrl}/reset-password`, payload)
      .pipe(catchError(this.handleError));
  }

  register(data: { name: string; email: string; password: string }, autoLogin = true) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => {
        if (autoLogin) {
          this.handleAuthSuccess(response);
        }
      }),
      catchError(this.handleError)
    );
  }

  registerForLoginRedirect(data: { name: string; email: string; password: string }) {
    return this.register(data, false);
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.currentUserSig.set(null);
    this.router.navigate(['/login']);
  }

  // --- Helpers ---
  private handleAuthSuccess(response: AuthResponse) {
    const normalizedUser = this.normalizeUser(response.user);
    if (this.isBrowser) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
    }
    this.currentUserSig.set(normalizedUser);
    this.closePopup();
  }

  private getUserFromStorage(): User | null {
    if (!this.isBrowser) return null;
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      // Industry standard: always try/catch localStorage JSON parsing
      return this.normalizeUser(JSON.parse(userStr) as Partial<User>);
    } catch (e) {
      console.error('Corrupted user data in storage, clearing...', e);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return null;
    }
  }

  private normalizeUser(user: Partial<User> | null | undefined): User {
    return {
      id: user?.id || '',
      name: user?.name || 'User',
      email: user?.email || '',
      role: user?.role === 'admin' ? 'admin' : 'user'
    };
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.statusText;
    }
    return throwError(() => new Error(errorMessage));
  }
}