import { Injectable, computed, signal } from '@angular/core';

export interface AuthUser { id: string; email: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly authState = signal<AuthUser | null>(null);
  readonly isAuthenticated = computed(() => this.authState() !== null);

  async register(email: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok && res.status !== 201) {
      const body = await res.json().catch(() => ({} as { error?: string }));
      const code = body?.error ?? (res.status === 409 ? 'email_taken' : 'register_failed');
      throw new Error(code);
    }
    await this.login(email, password);
  }

  async login(email: string, password: string): Promise<void> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.status === 401) throw new Error('invalid_credentials');
    if (!res.ok) throw new Error('login_failed');
    const body = await res.json() as AuthUser;
    this.authState.set({ id: body.id, email: body.email });
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    this.authState.set(null);
  }

  async fetchMe(): Promise<void> {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const body = await res.json() as AuthUser;
        this.authState.set({ id: body.id, email: body.email });
      } else {
        this.authState.set(null);
      }
    } catch {
      this.authState.set(null);
    }
  }

  async bootstrap(): Promise<void> {
    await this.fetchMe();
  }
}
