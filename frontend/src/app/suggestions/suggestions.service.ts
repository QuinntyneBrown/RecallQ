import { Injectable, signal } from '@angular/core';

export interface Suggestion {
  id: string;
  key: string;
  kind: string;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
}

@Injectable({ providedIn: 'root' })
export class SuggestionsService {
  readonly suggestion = signal<Suggestion | null>(null);

  async refresh(): Promise<void> {
    try {
      const res = await fetch('/api/suggestions', { credentials: 'include' });
      if (res.status !== 200) return;
      const raw = await res.text();
      if (!raw || raw === 'null') { this.suggestion.set(null); return; }
      const body = JSON.parse(raw) as Suggestion | null;
      this.suggestion.set(body);
    } catch {
      // ignore
    }
  }

  async dismiss(key: string): Promise<void> {
    this.suggestion.set(null);
    try {
      await fetch(`/api/suggestions/${encodeURIComponent(key)}/dismiss`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // best-effort; local state is already cleared
    }
  }
}
