import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InteractionsService, InteractionDto } from '../../interactions/interactions.service';
import { TimelineItemComponent } from '../../ui/timeline-item/timeline-item.component';

@Component({
  selector: 'app-all-activity-page',
  standalone: true,
  imports: [TimelineItemComponent],
  templateUrl: './all-activity.page.html',
  styleUrl: './all-activity.page.css',
})
export class AllActivityPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interactions = inject(InteractionsService);
  readonly items = signal<InteractionDto[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly nextPage = signal<number | null>(null);
  @ViewChild('sentinel') sentinel?: ElementRef<HTMLElement>;
  private observer?: IntersectionObserver;
  private observed = false;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    try {
      const result = await this.interactions.list(id, 1, 50);
      this.items.set(result.items);
      this.nextPage.set(result.nextPage);
    } catch {
      this.items.set([]);
    } finally {
      this.loading.set(false);
    }
    this.tryObserveSentinel();
  }

  ngAfterViewInit(): void {
    this.tryObserveSentinel();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private tryObserveSentinel(): void {
    if (this.observed || !this.sentinel || typeof IntersectionObserver === 'undefined') return;
    this.observed = true;
    this.observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void this.loadMore();
    }, { rootMargin: '200px' });
    this.observer.observe(this.sentinel.nativeElement);
  }

  async loadMore(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    const np = this.nextPage();
    if (!id || np == null || this.loadingMore()) return;
    this.loadingMore.set(true);
    try {
      const r = await this.interactions.list(id, np, 50);
      this.items.update(curr => curr.concat(r.items));
      this.nextPage.set(r.nextPage);
    } catch { /* leave as-is */ }
    finally {
      this.loadingMore.set(false);
    }
  }

  onEditInteraction(interactionId: string) {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    void this.router.navigate(['/contacts', id, 'interactions', interactionId, 'edit']);
  }

  async onDeleteInteraction(interactionId: string): Promise<void> {
    if (!window.confirm('Delete this interaction?')) return;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    try {
      await this.interactions.delete(interactionId);
      const result = await this.interactions.list(id, 1, 50);
      this.items.set(result.items);
      this.nextPage.set(result.nextPage);
    } catch {
      // leave list as-is on failure
    }
  }
}
