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
    const diffMs = Date.now() - new Date(iso).getTime();
    if (diffMs < 60_000) return 'just now';
    const m = Math.floor(diffMs / 60_000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }
}
