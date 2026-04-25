import { AfterViewInit, Component, ViewChild, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    RouterLink,
    QueryChipComponent,
    ResultCardComponent,
    FeaturedResultCardComponent,
    ZeroStateComponent,
    SortMenuComponent,
  ],
  template: `
    <section class="page">
      <div class="list-pane" data-testid="results-list-pane">
        <div class="toolbar">
          @if (q()) {
            <app-query-chip [q]="q()"></app-query-chip>
          }
          @if (stackName()) {
            <span class="stack-chip" data-testid="stack-chip">Stack: {{ stackName() }}</span>
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
          <app-zero-state [q]="q()"></app-zero-state>
        }

        @if (results().length > 0) {
          @if (featured(); as f) {
            @if (contactFor(f.contactId); as c) {
              <app-featured-result-card [result]="f" [contact]="c" (select)="onSelect($event)"></app-featured-result-card>
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
                <app-result-card [result]="r" [contact]="c" (select)="onSelect($event)"></app-result-card>
              }
            </ng-container>
          </cdk-virtual-scroll-viewport>
          @if (!searchService.hasMore() && !loading()) {
            <p class="end-of-results" data-testid="end-of-results">End of results</p>
          }
        }

        @if (loading()) {
          <div class="skeletons" aria-live="polite">
            <div class="skeleton"></div>
            <div class="skeleton"></div>
            <div class="skeleton"></div>
          </div>
        }
      </div>

      <aside class="detail-pane" data-testid="results-detail-pane">
        @if (selectedContactId() && selectedContact(); as c) {
          <div class="detail-card" data-testid="detail-summary">
            <div class="detail-head">
              <span class="avatar-lg" aria-hidden="true">{{ c.initials }}</span>
              <div class="detail-text">
                <h2 class="detail-name" data-testid="detail-name">{{ c.displayName }}</h2>
                @if (c.role || c.organization) {
                  <p class="detail-sub">{{ subLineFor(c) }}</p>
                }
              </div>
            </div>
            <a class="open-link" [routerLink]="['/contacts', c.id]" data-testid="open-full-profile">
              Open full profile →
            </a>
          </div>
        } @else {
          <div data-testid="select-placeholder" class="placeholder">
            Select a contact to see details
          </div>
        }
      </aside>
    </section>
  `,
  styles: [`
    .page {
      padding: 16px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      color: var(--foreground-primary);
      align-items: start;
    }
    .list-pane {
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-width: 0;
    }
    .detail-pane {
      display: none;
      min-width: 0;
    }
    @media (min-width: 992px) {
      .page {
        grid-template-columns: minmax(360px, 400px) 1fr;
      }
      .detail-pane { display: block; }
    }
    .toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .stack-chip {
      padding: 4px 10px;
      border-radius: var(--radius-full);
      border: 1px solid var(--stack-border);
      font-size: 12px;
      color: var(--foreground-secondary);
      background: var(--surface-elevated);
    }
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
    .end-of-results {
      color: var(--foreground-secondary);
      font-size: 13px;
      padding: 12px 0;
      text-align: center;
      margin: 0;
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
    .placeholder {
      padding: 24px;
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-lg);
      color: var(--foreground-secondary);
      text-align: center;
      background: var(--surface-elevated);
    }
    .detail-card {
      padding: 20px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .detail-head { display: flex; align-items: center; gap: 16px; }
    .avatar-lg {
      width: 72px; height: 72px;
      border-radius: var(--radius-full);
      display: inline-flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 24px;
      color: var(--foreground-primary);
      background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-mid));
    }
    .detail-text { min-width: 0; }
    .detail-name { margin: 0; font-size: 20px; font-weight: 600; }
    .detail-sub { margin: 4px 0 0 0; color: var(--foreground-secondary); font-size: 14px; }
    .open-link {
      color: var(--accent-primary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
    .open-link:hover { text-decoration: underline; }
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

  readonly stackName = signal<string | null>(null);
  readonly contactsMap = signal<Map<string, ResultCardContact>>(new Map());
  readonly featured = computed<SearchResult | null>(() => this.results()[0] ?? null);
  readonly standardResults = computed<SearchResult[]>(() => this.results().slice(1));

  readonly selectedContactId = signal<string | null>(null);
  readonly selectedContact = signal<ResultCardContact | null>(null);

  @ViewChild(CdkVirtualScrollViewport) viewport?: CdkVirtualScrollViewport;
  private viewportSub?: Subscription;
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.route.queryParamMap.subscribe(async params => {
      const stackId = params.get('stackId');
      const stackName = params.get('stackName');
      this.stackName.set(stackId && stackName ? stackName : null);
      const q = stackId && stackName ? stackName : (params.get('q') ?? '');
      const sortParam = (params.get('sort') ?? 'similarity') as SearchSort;
      const sort: SearchSort = sortParam === 'recent' ? 'recent' : 'similarity';
      await this.searchService.search(q, { reset: true, sort });
      await this.hydrateContacts();
    });
  }

  ngAfterViewInit(): void {
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

  onSelect(contactId: string): void {
    this.selectedContactId.set(contactId);
    const cached = this.contactsMap().get(contactId);
    if (cached) {
      this.selectedContact.set(cached);
    } else {
      this.selectedContact.set(null);
      void this.contactsService.get(contactId).then(c => {
        if (!c || this.selectedContactId() !== contactId) return;
        this.selectedContact.set({
          id: c.id,
          displayName: c.displayName,
          initials: c.initials,
          role: c.role,
          organization: c.organization,
          tags: c.tags,
        });
      });
    }
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

  subLineFor(c: ResultCardContact): string {
    return [c.role, c.organization].filter(p => p && p.length > 0).join(' · ');
  }
}
