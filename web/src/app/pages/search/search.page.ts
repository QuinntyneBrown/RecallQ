import { AfterViewInit, Component, ViewChild, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { SearchService, SearchResult, SearchSort } from '../../search/search.service';
import { ContactsService, ContactDetailDto } from '../../contacts/contacts.service';
import { QueryChipComponent } from '../../ui/query-chip/query-chip.component';
import { ResultCardComponent, ResultCardContact } from '../../ui/result-card/result-card.component';
import { FeaturedResultCardComponent } from '../../ui/featured-result-card/featured-result-card.component';
import { ZeroStateComponent } from '../../ui/zero-state/zero-state.component';
import { SortMenuComponent } from '../../ui/sort-menu/sort-menu.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [
    ScrollingModule,
    QueryChipComponent,
    ResultCardComponent,
    FeaturedResultCardComponent,
    ZeroStateComponent,
    SortMenuComponent,
  ],
  template: `
    <section class="page">
      <div class="toolbar">
        @if (q()) {
          <app-query-chip [q]="q()"></app-query-chip>
        }
        <app-sort-menu [sort]="sort()" (sortChange)="onSortChange($event)"></app-sort-menu>
      </div>
      <div class="meta">
        <span data-testid="match-count">{{ contactsMatched() }} contacts matched</span>
      </div>

      @if (error()) {
        <div class="error" role="alert">{{ error() }}</div>
      }

      @if (!loading() && !error() && results().length === 0) {
        <app-zero-state></app-zero-state>
      }

      @if (results().length > 0) {
        @if (featured(); as f) {
          @if (contactFor(f.contactId); as c) {
            <app-featured-result-card [result]="f" [contact]="c"></app-featured-result-card>
          }
        }
        <cdk-virtual-scroll-viewport
          itemSize="96"
          class="results-viewport"
          data-testid="results-viewport"
          (scrolledIndexChange)="onScrolledIndexChange($event)"
        >
          <ng-container *cdkVirtualFor="let r of standardResults(); trackBy: trackById">
            @if (contactFor(r.contactId); as c) {
              <app-result-card [result]="r" [contact]="c"></app-result-card>
            }
          </ng-container>
        </cdk-virtual-scroll-viewport>
      }

      @if (loading()) {
        <div class="skeletons" aria-live="polite">
          <div class="skeleton"></div>
          <div class="skeleton"></div>
          <div class="skeleton"></div>
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
    .toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .meta { color: var(--foreground-secondary); font-size: 13px; }
    .error {
      background: color-mix(in srgb, var(--accent-secondary) 15%, transparent);
      color: var(--foreground-primary);
      padding: 10px 12px;
      border-radius: var(--radius-md);
      font-size: 13px;
    }
    .results-viewport {
      height: calc(100vh - 240px);
      min-height: 320px;
      width: 100%;
      display: block;
    }
    .results-viewport ::ng-deep .cdk-virtual-scroll-content-wrapper {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;
    }
    .skeletons { display: flex; flex-direction: column; gap: 10px; }
    .skeleton {
      height: 84px;
      border-radius: var(--radius-lg);
      background: linear-gradient(90deg,
        color-mix(in srgb, var(--foreground-primary) 6%, transparent),
        color-mix(in srgb, var(--foreground-primary) 12%, transparent),
        color-mix(in srgb, var(--foreground-primary) 6%, transparent));
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class SearchResultsPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly searchService = inject(SearchService);
  private readonly contactsService = inject(ContactsService);

  readonly results = this.searchService.results;
  readonly loading = this.searchService.loading;
  readonly error = this.searchService.error;
  readonly q = this.searchService.query;
  readonly contactsMatched = this.searchService.contactsMatched;
  readonly sort = this.searchService.sort;

  readonly contactsMap = signal<Map<string, ResultCardContact>>(new Map());
  readonly featured = computed<SearchResult | null>(() => this.results()[0] ?? null);
  readonly standardResults = computed<SearchResult[]>(() => this.results().slice(1));

  @ViewChild(CdkVirtualScrollViewport) viewport?: CdkVirtualScrollViewport;
  private viewportSub?: Subscription;
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe(async params => {
      const q = params.get('q') ?? '';
      const sortParam = (params.get('sort') ?? 'similarity') as SearchSort;
      const sort: SearchSort = sortParam === 'recent' ? 'recent' : 'similarity';
      await this.searchService.search(q, { reset: true, sort });
      await this.hydrateContacts();
    });
  }

  ngAfterViewInit(): void {
    // The viewport may not exist yet if no results. Poll via queueMicrotask each update.
    setTimeout(() => this.attachViewportScroll(), 0);
  }

  private attachViewportScroll(): void {
    this.viewportSub?.unsubscribe();
    if (!this.viewport) return;
    this.viewportSub = this.viewport.elementScrolled().subscribe(() => {
      const end = this.viewport!.measureScrollOffset('bottom');
      if (end < 200 && this.searchService.hasMore() && !this.loading()) {
        void this.searchService.loadMore().then(() => this.hydrateContacts());
      }
    });
  }

  onScrolledIndexChange(_: number): void {
    if (!this.viewportSub) this.attachViewportScroll();
    if (!this.viewport) return;
    const end = this.viewport.measureScrollOffset('bottom');
    if (end < 200 && this.searchService.hasMore() && !this.loading()) {
      void this.searchService.loadMore().then(() => this.hydrateContacts());
    }
  }

  onSortChange(sort: SearchSort): void {
    void this.router.navigate(['/search'], {
      queryParams: { sort },
      queryParamsHandling: 'merge',
    });
  }

  trackById = (_: number, r: SearchResult): string => r.contactId;

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.viewportSub?.unsubscribe();
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
