import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AuthUser { id: string; email: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly authState = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => this.authState() !== null);

  constructor(private http: HttpClient) {}

  async register(email: string, password: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<AuthUser>('/api/auth/register', { email, password })
      );
    } catch (err: any) {
      const code = err.error?.error ?? (err.status === 409 ? 'email_taken' : 'register_failed');
      throw new Error(code);
    }
    await this.login(email, password, false);
  }

  async login(email: string, password: string, rememberMe: boolean): Promise<void> {
    try {
      const body = await firstValueFrom(
        this.http.post<AuthUser>('/api/auth/login', { email, password, rememberMe })
      );
      this.authState.set({ id: body.id, email: body.email });
    } catch (err: any) {
      if (err.status === 401) throw new Error('invalid_credentials');
      if (err.status === 429) throw new Error('rate_limited');
      throw new Error('login_failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>('/api/auth/logout', {})
      );
    } catch {
      // ignore
    }
    this.authState.set(null);
  }

  async fetchMe(): Promise<void> {
    try {
      const body = await firstValueFrom(
        this.http.get<AuthUser>('/api/auth/me')
      );
      this.authState.set({ id: body.id, email: body.email });
    } catch {
      this.authState.set(null);
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>('/api/auth/request-password-reset', { email })
      );
    } catch (err: any) {
      if (err.status === 429) throw new Error('rate_limited');
      throw new Error('request_password_reset_failed');
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>('/api/auth/reset-password', { token, password })
      );
    } catch (err: any) {
      if (err.status === 400) throw new Error('invalid_token_or_password');
      throw new Error('reset_password_failed');
    }
  }

  async bootstrap(): Promise<void> {
    await this.fetchMe();
  }
}
