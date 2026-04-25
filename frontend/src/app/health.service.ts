import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export const API_BASE = '';

@Injectable({ providedIn: 'root' })
export class HealthService {
  readonly online = signal(false);
  private started = false;

  constructor(private http: HttpClient) {}

  async check(): Promise<void> {
    try {
      const text = await firstValueFrom(
        this.http.get('/api/ping', { responseType: 'text' })
      );
      this.online.set(text.trim() === 'pong');
    } catch {
      this.online.set(false);
    }
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    void this.check();
    setInterval(() => void this.check(), 5000);
  }
}
