import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  show(text: string, durationMs = 2500): void {
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.toasts.update((list) => [...list, { id, text }]);
    setTimeout(() => {
      this.toasts.update((list) => list.filter((t) => t.id !== id));
    }, durationMs);
  }
}
