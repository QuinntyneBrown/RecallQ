import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SummaryResponse } from '../../contacts/contacts.service';

@Component({
  selector: 'app-relationship-summary-card',
  standalone: true,
  templateUrl: './relationship-summary-card.component.html',
  styleUrl: './relationship-summary-card.component.css',
})
export class RelationshipSummaryCardComponent {
  @Input({ required: true }) summary!: SummaryResponse;
  @Input() refreshing: boolean = false;
  @Output() refresh = new EventEmitter<void>();

  sinceLast(): string {
    const iso = this.summary.lastInteractionAt;
    if (!iso) return '—';
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffMs = now - then;
    if (diffMs < 60_000) return 'just now';
    const h = Math.floor(diffMs / 3_600_000);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }
}
