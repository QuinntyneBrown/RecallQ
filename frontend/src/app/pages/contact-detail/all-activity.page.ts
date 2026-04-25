import { Component, OnInit, inject, signal } from '@angular/core';
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
export class AllActivityPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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

  onEditInteraction(interactionId: string) {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    void this.router.navigate(['/contacts', id, 'interactions', interactionId, 'edit']);
  }
}
