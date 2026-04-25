import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ScoreChipComponent } from '../score-chip/score-chip.component';

export interface Citation {
  contactId: string;
  contactName: string;
  snippet: string;
  similarity: number;
  source: 'contact' | 'interaction';
}

@Component({
  selector: 'app-citation-card',
  standalone: true,
  imports: [ScoreChipComponent],
  template: `
    <a class="citation" [class.top]="top" [attr.href]="'/contacts/' + citation.contactId"
       (click)="nav($event)" role="link" data-testid="citation-card">
      <div class="row">
        <strong>{{ citation.contactName }}</strong>
        <app-score-chip [value]="citation.similarity"/>
      </div>
      <p class="snippet">{{ citation.snippet }}</p>
    </a>
  `,
  styles: [`
    .citation {
      display: block;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      color: var(--foreground-primary);
      text-decoration: none;
      border: 1px solid transparent;
    }
    .citation.top { border: 1px solid var(--citation-border-top); }
    .row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
    .row strong { font-size: 14px; font-weight: 600; }
    .snippet { margin: 4px 0 0; font-size: 13px; color: var(--foreground-secondary); line-height: 1.35; }
  `],
})
export class CitationCardComponent {
  @Input({ required: true }) citation!: Citation;
  @Input() top: boolean = false;
  private readonly router = inject(Router);

  nav(e: MouseEvent): void {
    e.preventDefault();
    this.router.navigate(['/contacts', this.citation.contactId]);
  }
}
