import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InteractionsService, InteractionDto } from '../../interactions/interactions.service';
import { TimelineItemComponent } from '../../ui/timeline-item/timeline-item.component';

@Component({
  selector: 'app-all-activity-page',
  standalone: true,
  imports: [TimelineItemComponent],
  template: `
    <section class="page">
      <h1>All activity</h1>
      @if (loading()) {
        <p class="muted">Loading…</p>
      } @else if (items().length === 0) {
        <p class="empty">No activity yet</p>
      } @else {
        <ul data-testid="all-activity" role="list" class="timeline">
          @for (item of items(); track item.id) {
            <li role="listitem" class="timeline-item">
              <app-timeline-item [item]="item"></app-timeline-item>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    .page { padding: 24px; color: var(--foreground-primary); }
    h1 { font-family: Geist, system-ui, sans-serif; margin: 0 0 16px; }
    .muted { color: var(--foreground-secondary); }
    .empty { color: var(--foreground-secondary); }
    .timeline { list-style: none; padding: 0; margin: 0; }
    .timeline-item { border-bottom: 1px solid var(--border-subtle); }
    .timeline-item:last-child { border-bottom: 0; }
  `],
})
export class AllActivityPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly interactions = inject(InteractionsService);
  readonly items = signal<InteractionDto[]>([]);
  readonly loading = signal(true);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    try {
      const result = await this.interactions.list(id, 1, 50);
      this.items.set(result.items);
    } catch {
      this.items.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
