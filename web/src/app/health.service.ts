import { Injectable, signal } from '@angular/core';

export const API_BASE = '';

@Injectable({ providedIn: 'root' })
export class HealthService {
  readonly online = signal(false);
  private started = false;

  async check(): Promise<void> {
    try {
      const res = await fetch(`/api/ping`);
      if (res.ok) {
        const text = (await res.text()).trim();
        this.online.set(text === 'pong');
        return;
      }
    } catch {
      // fall through
    }
    this.online.set(false);
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    void this.check();
    setInterval(() => void this.check(), 5000);
  }
}
