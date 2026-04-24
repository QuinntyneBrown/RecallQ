import { Injectable, signal } from '@angular/core';

export interface SearchResult {
  contactId: string;
  matchedSource: 'contact' | 'interaction' | string;
  similarity: number;
  matchedText: string;
  occurredAt?: string | null;
}

interface SearchResponse {
  results: SearchResult[];
  nextPage: number | null;
  contactsMatched: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  readonly results = signal<SearchResult[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly query = signal('');
  readonly contactsMatched = signal(0);

  async search(q: string): Promise<void> {
    this.query.set(q);
    this.loading.set(true);
    this.error.set(null);
    try {
      if (!q || !q.trim()) {
        this.results.set([]);
        this.contactsMatched.set(0);
        this.error.set('Query is required');
        return;
      }
      const res = await fetch('/api/search', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q }),
      });
      if (res.status === 200) {
        const body = (await res.json()) as SearchResponse;
        this.results.set(body.results ?? []);
        this.contactsMatched.set(body.contactsMatched ?? 0);
        return;
      }
      if (res.status === 400) {
        this.results.set([]);
        this.contactsMatched.set(0);
        this.error.set('Invalid query');
        return;
      }
      if (res.status === 503) {
        this.results.set([]);
        this.contactsMatched.set(0);
        this.error.set('Embeddings are being regenerated, try again shortly');
        return;
      }
      this.results.set([]);
      this.contactsMatched.set(0);
      this.error.set('search_failed_' + res.status);
    } finally {
      this.loading.set(false);
    }
  }
}
