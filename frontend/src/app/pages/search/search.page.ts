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
  templateUrl: './search.page.html',
  styleUrl: './search.page.css',
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
  readonly matchCountLabel = computed(() => {
    const n = this.contactsMatched();
    return n === 1 ? '1 contact matched' : `${n} contacts matched`;
  });
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
          avatarColorA: c.avatarColorA,
          avatarColorB: c.avatarColorB,
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
          avatarColorA: c.avatarColorA,
          avatarColorB: c.avatarColorB,
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
