import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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

  constructor(private http: HttpClient) {}

  async refresh(): Promise<void> {
    try {
      const raw = await firstValueFrom(
        this.http.get('/api/suggestions', { responseType: 'text' })
      );
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
      await firstValueFrom(
        this.http.post<void>(`/api/suggestions/${encodeURIComponent(key)}/dismiss`, {})
      );
    } catch {
      // best-effort; local state is already cleared
    }
  }
}
