import { Injectable, signal } from '@angular/core';

export type SearchSort = 'similarity' | 'recent';

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
  readonly sort = signal<SearchSort>('similarity');
  readonly hasMore = signal(false);
  readonly page = signal(1);
  private readonly pageSize = 50;

  async search(q: string, opts?: { reset?: boolean; sort?: SearchSort }): Promise<void> {
    const sort = opts?.sort ?? this.sort();
    this.sort.set(sort);
    this.query.set(q);
    this.loading.set(true);
    this.error.set(null);
    try {
      if (!q || !q.trim()) {
        this.results.set([]);
        this.contactsMatched.set(0);
        this.hasMore.set(false);
        this.page.set(1);
        this.error.set('Query is required');
        return;
      }
      const res = await fetch('/api/search', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, page: 1, pageSize: this.pageSize, sort }),
      });
      if (res.status === 200) {
        const body = (await res.json()) as SearchResponse;
        this.results.set(body.results ?? []);
        this.contactsMatched.set(body.contactsMatched ?? 0);
        this.hasMore.set(body.nextPage != null);
        this.page.set(1);
        return;
      }
      this.results.set([]);
      this.contactsMatched.set(0);
      this.hasMore.set(false);
      this.page.set(1);
      if (res.status === 400) this.error.set('Invalid query');
      else if (res.status === 429) this.error.set('Too many searches. Try again in a minute.');
      else if (res.status === 503) this.error.set('Embeddings are being regenerated, try again shortly');
      else this.error.set('Search failed. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    if (!this.hasMore() || this.loading()) return;
    const q = this.query();
    if (!q || !q.trim()) return;
    const nextPage = this.page() + 1;
    this.loading.set(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, page: nextPage, pageSize: this.pageSize, sort: this.sort() }),
      });
      if (res.status === 200) {
        const body = (await res.json()) as SearchResponse;
        this.results.update(curr => curr.concat(body.results ?? []));
        this.hasMore.set(body.nextPage != null);
        this.page.set(nextPage);
      } else {
        this.hasMore.set(false);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async setSort(sort: SearchSort): Promise<void> {
    if (sort === this.sort()) return;
    await this.search(this.query(), { reset: true, sort });
  }
}
