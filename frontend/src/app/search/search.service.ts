import { Injectable, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

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
  readonly loadMoreError = signal(false);
  private readonly pageSize = 50;

  constructor(private http: HttpClient, private auth: AuthService) {
    effect(() => {
      if (this.auth.authState() === null) this.reset();
    });
  }

  private reset(): void {
    this.results.set([]);
    this.loading.set(false);
    this.error.set(null);
    this.query.set('');
    this.contactsMatched.set(0);
    this.sort.set('similarity');
    this.hasMore.set(false);
    this.page.set(1);
    this.loadMoreError.set(false);
  }

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
      try {
        const body = await firstValueFrom(
          this.http.post<SearchResponse>('/api/search', {
            q,
            page: 1,
            pageSize: this.pageSize,
            sort,
          })
        );
        this.results.set(body.results ?? []);
        this.contactsMatched.set(body.contactsMatched ?? 0);
        this.hasMore.set(body.nextPage != null);
        this.page.set(1);
        return;
      } catch (err: any) {
        this.results.set([]);
        this.contactsMatched.set(0);
        this.hasMore.set(false);
        this.page.set(1);
        if (err.status === 400) this.error.set('Invalid query');
        else if (err.status === 429) this.error.set('Too many searches. Try again in a minute.');
        else if (err.status === 503) this.error.set('Embeddings are being regenerated, try again shortly');
        else this.error.set('Search failed. Please try again.');
      }
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
    this.loadMoreError.set(false);
    try {
      const body = await firstValueFrom(
        this.http.post<SearchResponse>('/api/search', {
          q,
          page: nextPage,
          pageSize: this.pageSize,
          sort: this.sort(),
        })
      );
      this.results.update(curr => curr.concat(body.results ?? []));
      this.hasMore.set(body.nextPage != null);
      this.page.set(nextPage);
    } catch {
      this.loadMoreError.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async setSort(sort: SearchSort): Promise<void> {
    if (sort === this.sort()) return;
    await this.search(this.query(), { reset: true, sort });
  }
}
