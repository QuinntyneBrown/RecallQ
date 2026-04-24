import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointService } from '../../shell/breakpoint.service';
import { SearchResult } from '../../search/search.service';
import { ScoreChipComponent } from '../score-chip/score-chip.component';
import { InteractionPill, InteractionPillsComponent } from '../interaction-pills/interaction-pills.component';

export interface ResultCardContact {
  id: string;
  displayName: string;
  initials: string;
  role: string | null;
  organization: string | null;
  tags?: string[];
}

@Component({
  selector: 'app-result-card',
  standalone: true,
  imports: [ScoreChipComponent, InteractionPillsComponent],
  template: `
    <a class="card"
       data-testid="result-card"
       role="link"
       [attr.data-contact-id]="contact.id"
       [attr.href]="'/contacts/' + contact.id"
       (click)="nav($event)">
      <span class="avatar" aria-hidden="true">{{ contact.initials }}</span>
      <span class="body">
        <span class="name">{{ contact.displayName }}</span>
        <span class="sub">{{ subLine() }}</span>
        <app-interaction-pills [pills]="pills()"></app-interaction-pills>
      </span>
      <span class="score">
        <app-score-chip [value]="result.similarity"></app-score-chip>
      </span>
    </a>
  `,
  styles: [`
    .card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: var(--radius-lg);
      background: var(--surface-elevated);
      border: 1px solid var(--border-subtle);
      color: var(--foreground-primary);
      text-decoration: none;
      cursor: pointer;
    }
    .avatar {
      flex: 0 0 auto;
      width: 48px; height: 48px;
      border-radius: var(--radius-full);
      display: inline-flex; align-items: center; justify-content: center;
      font-weight: 600;
      color: var(--foreground-primary);
      background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-mid));
    }
    .body { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
    .name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sub { color: var(--foreground-secondary); font-size: 13px; }
    .score { flex: 0 0 auto; }
  `],
})
export class ResultCardComponent {
  private readonly router = inject(Router);
  private readonly breakpoints = inject(BreakpointService);
  @Input({ required: true }) result!: SearchResult;
  @Input({ required: true }) contact!: ResultCardContact;
  @Output() select = new EventEmitter<string>();

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
    if (this.breakpoints.lg()) {
      this.select.emit(this.contact.id);
      return;
    }
    void this.router.navigate(['/contacts', this.contact.id]);
  }
}
