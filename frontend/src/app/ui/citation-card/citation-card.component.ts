import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ScoreChipComponent } from '../score-chip/score-chip.component';

export interface Citation {
  contactId: string;
  contactName: string;
  contactRole?: string | null;
  contactOrganization?: string | null;
  snippet: string;
  similarity: number;
  source: 'contact' | 'interaction';
}

@Component({
  selector: 'app-citation-card',
  standalone: true,
  imports: [ScoreChipComponent],
  templateUrl: './citation-card.component.html',
  styleUrl: './citation-card.component.css',
})
export class CitationCardComponent {
  @Input({ required: true }) citation!: Citation;
  @Input() top: boolean = false;
  private readonly router = inject(Router);

  ariaLabel(): string {
    const c = this.citation;
    const role = c.contactRole?.trim();
    const org = c.contactOrganization?.trim();
    const middle = role && org ? `${role} at ${org}` : (role || org || '');
    return middle.length
      ? `Contact: ${c.contactName}, ${middle}, similarity ${c.similarity.toFixed(2)}`
      : `Contact: ${c.contactName}, similarity ${c.similarity.toFixed(2)}`;
  }

  initials(): string {
    return (this.citation.contactName ?? '')
      .split(/\s+/)
      .filter(s => s.length > 0)
      .slice(0, 2)
      .map(s => s[0].toUpperCase())
      .join('');
  }

  nav(e: MouseEvent): void {
    e.preventDefault();
    this.router.navigate(['/contacts', this.citation.contactId]);
  }
}
