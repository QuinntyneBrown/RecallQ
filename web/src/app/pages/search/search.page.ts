import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SearchService, SearchResult } from '../../search/search.service';
import { ContactsService, ContactDetailDto } from '../../contacts/contacts.service';
import { QueryChipComponent } from '../../ui/query-chip/query-chip.component';
import { ResultCardComponent, ResultCardContact } from '../../ui/result-card/result-card.component';
import { FeaturedResultCardComponent } from '../../ui/featured-result-card/featured-result-card.component';
import { ZeroStateComponent } from '../../ui/zero-state/zero-state.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [QueryChipComponent, ResultCardComponent, FeaturedResultCardComponent, ZeroStateComponent],
  template: `
    <section class="page">
      @if (q()) {
        <app-query-chip [q]="q()"></app-query-chip>
      }
      <div class="meta">
        <span data-testid="match-count">{{ contactsMatched() }} contacts matched</span>
      </div>

      @if (loading()) {
        <div class="loading" aria-live="polite">Searching…</div>
      }
      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      @if (!loading() && !error() && results().length === 0) {
        <app-zero-state></app-zero-state>
      }

      @if (!loading() && results().length > 0) {
        @if (featured(); as f) {
          @if (contactFor(f.contactId); as c) {
            <app-featured-result-card [result]="f" [contact]="c"></app-featured-result-card>
          }
        }
        <div class="list">
          @for (r of rest(); track r.contactId) {
            @if (contactFor(r.contactId); as c) {
              <app-result-card [result]="r" [contact]="c"></app-result-card>
            }
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .page {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      color: var(--foreground-primary);
    }
    .meta { color: var(--foreground-secondary); font-size: 13px; }
    .loading { color: var(--foreground-secondary); }
    .error {
      background: color-mix(in srgb, var(--accent-secondary) 15%, transparent);
      color: var(--foreground-primary);
      padding: 10px 12px;
      border-radius: var(--radius-md);
      font-size: 13px;
    }
    .list { display: flex; flex-direction: column; gap: 10px; }
  `],
})
export class SearchResultsPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly searchService = inject(SearchService);
  private readonly contactsService = inject(ContactsService);

  readonly results = this.searchService.results;
  readonly loading = this.searchService.loading;
  readonly error = this.searchService.error;
  readonly q = this.searchService.query;
  readonly contactsMatched = this.searchService.contactsMatched;

  readonly contactsMap = signal<Map<string, ResultCardContact>>(new Map());
  readonly featured = computed<SearchResult | null>(() => this.results()[0] ?? null);
  readonly rest = computed<SearchResult[]>(() => this.results().slice(1));

  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe(async params => {
      const q = params.get('q') ?? '';
      await this.searchService.search(q);
      await this.hydrateContacts();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private async hydrateContacts(): Promise<void> {
    const ids = Array.from(new Set(this.results().map(r => r.contactId)));
    const existing = this.contactsMap();
    const missing = ids.filter(id => !existing.has(id));
    if (missing.length === 0) return;
    const fetched = await Promise.all(missing.map(id => this.contactsService.get(id).catch(() => null)));
    const next = new Map(existing);
    fetched.forEach((c: ContactDetailDto | null, i: number) => {
      const id = missing[i];
      if (c) {
        next.set(id, {
          id: c.id,
          displayName: c.displayName,
          initials: c.initials,
          role: c.role,
          organization: c.organization,
          tags: c.tags,
        });
      } else {
        next.set(id, { id, displayName: 'Unknown', initials: '?', role: null, organization: null, tags: [] });
      }
    });
    this.contactsMap.set(next);
  }

  contactFor(id: string): ResultCardContact | null {
    return this.contactsMap().get(id) ?? null;
  }
}
