import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SummaryResponse } from '../../contacts/contacts.service';

@Component({
  selector: 'app-relationship-summary-card',
  standalone: true,
  template: `
    <div class="ai-card">
      <div class="hdr">
        <p class="eyebrow">RELATIONSHIP SUMMARY</p>
        <button type="button" aria-label="Refresh summary" (click)="refresh.emit()">
          <i class="ph ph-arrows-clockwise"></i>
        </button>
      </div>
      @if (summary.status === 'ready') {
        <p data-testid="summary-paragraph">{{ summary.paragraph }}</p>
        <div class="stats">
          <div data-testid="stat-interactions">
            <strong>{{ summary.interactionCount }}</strong>
            <span>Interactions</span>
          </div>
          <div data-testid="stat-sentiment" [attr.data-tone]="summary.sentiment?.toLowerCase()">
            <strong>{{ summary.sentiment }}</strong>
            <span>Sentiment</span>
          </div>
          <div data-testid="stat-since-last">
            <strong>{{ sinceLast() }}</strong>
            <span>Since last</span>
          </div>
        </div>
      } @else if (summary.status === 'not_enough_data') {
        <p>Not enough data to summarize this relationship yet.</p>
      } @else {
        <p class="skeleton">Generating summary…</p>
      }
    </div>
  `,
  styles: [`
    .ai-card {
      background: var(--surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 16px;
      color: var(--foreground-primary);
      display: grid;
      grid-auto-rows: min-content;
      gap: 12px;
    }
    .hdr { display: flex; align-items: center; justify-content: space-between; }
    .eyebrow {
      margin: 0;
      font-size: 11px;
      letter-spacing: 0.12em;
      color: var(--foreground-muted);
    }
    .hdr button {
      background: transparent;
      border: 0;
      color: var(--foreground-secondary);
      cursor: pointer;
      padding: 4px 6px;
      border-radius: var(--radius-full);
    }
    .hdr button:hover { color: var(--foreground-primary); }
    [data-testid="summary-paragraph"] {
      margin: 0;
      color: var(--foreground-primary);
      font-size: 14px;
      line-height: 1.45;
    }
    .skeleton { margin: 0; color: var(--foreground-muted); }
    .stats {
      display: flex;
      gap: 8px;
      align-items: stretch;
      border-top: 1px solid var(--border-subtle);
      padding-top: 12px;
    }
    .stats > div {
      flex: 1 1 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 8px;
      border-right: 1px solid var(--border-subtle);
    }
    .stats > div:last-child { border-right: 0; }
    .stats strong {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground-primary);
    }
    .stats span {
      font-size: 11px;
      color: var(--foreground-muted);
    }
    .stats [data-tone="warm"] strong { color: var(--success); }
    .stats [data-tone="neutral"] strong { color: var(--foreground-primary); }
    .stats [data-tone="cool"] strong { color: var(--accent-tertiary); }
  `],
})
export class RelationshipSummaryCardComponent {
  @Input({ required: true }) summary!: SummaryResponse;
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
