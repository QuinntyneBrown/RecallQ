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
  templateUrl: './citation-card.component.html',
  styleUrl: './citation-card.component.css',
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
