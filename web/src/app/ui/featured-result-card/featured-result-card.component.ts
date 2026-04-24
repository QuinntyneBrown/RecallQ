import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SearchResult } from '../../search/search.service';
import { ScoreChipComponent } from '../score-chip/score-chip.component';
import { InteractionPill, InteractionPillsComponent } from '../interaction-pills/interaction-pills.component';
import { ResultCardContact } from '../result-card/result-card.component';

@Component({
  selector: 'app-featured-result-card',
  standalone: true,
  imports: [ScoreChipComponent, InteractionPillsComponent],
  template: `
    <a class="card"
       data-testid="featured-result"
       role="link"
       [attr.href]="'/contacts/' + contact.id"
       (click)="nav($event)">
      <span class="eyebrow">WHY THIS MATCH</span>
      <span class="matched">{{ result.matchedText }}</span>
      <span class="row">
        <span class="avatar" aria-hidden="true">{{ contact.initials }}</span>
        <span class="body">
          <span class="name">{{ contact.displayName }}</span>
          <span class="sub">{{ subLine() }}</span>
          <app-interaction-pills [pills]="pills()"></app-interaction-pills>
        </span>
        <span class="score">
          <app-score-chip [value]="result.similarity"></app-score-chip>
        </span>
      </span>
    </a>
  `,
  styles: [`
    .card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 16px;
      border-radius: var(--radius-lg);
      background: var(--surface-elevated);
      border: 2px solid var(--featured-border);
      box-shadow: 0 0 24px color-mix(in srgb, var(--accent-primary) 24%, transparent);
      color: var(--foreground-primary);
      text-decoration: none;
      cursor: pointer;
    }
    .eyebrow {
      font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      color: var(--foreground-muted);
    }
    .matched {
      color: var(--foreground-primary);
      font-size: 14px;
      line-height: 1.4;
    }
    .row { display: flex; align-items: center; gap: 12px; }
    .avatar {
      flex: 0 0 auto;
      width: 64px; height: 64px;
      border-radius: var(--radius-full);
      display: inline-flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: 20px;
      color: var(--foreground-primary);
      background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-mid));
    }
    .body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .name { font-weight: 600; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sub { color: var(--foreground-secondary); font-size: 13px; }
    .score { flex: 0 0 auto; }
  `],
})
export class FeaturedResultCardComponent {
  private readonly router = inject(Router);
  @Input({ required: true }) result!: SearchResult;
  @Input({ required: true }) contact!: ResultCardContact;

  subLine() {
    const parts = [this.contact.role, this.contact.organization].filter(p => p && p.trim().length);
    return parts.join(' · ');
  }

  pills(): InteractionPill[] {
    const src = this.result.matchedSource;
    if (src === 'interaction') return [{ type: 'email', label: 'Interaction' }];
    return [{ type: 'contact', label: 'Contact' }];
  }

  nav(ev: Event): void {
    ev.preventDefault();
    void this.router.navigate(['/contacts', this.contact.id]);
  }
}
