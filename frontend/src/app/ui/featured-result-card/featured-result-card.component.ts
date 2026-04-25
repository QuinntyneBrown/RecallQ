import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointService } from '../../shell/breakpoint.service';
import { SearchResult } from '../../search/search.service';
import { ScoreChipComponent } from '../score-chip/score-chip.component';
import { InteractionPill, InteractionPillsComponent } from '../interaction-pills/interaction-pills.component';
import { ResultCardContact } from '../result-card/result-card.component';

@Component({
  selector: 'app-featured-result-card',
  standalone: true,
  imports: [ScoreChipComponent, InteractionPillsComponent],
  templateUrl: './featured-result-card.component.html',
  styleUrl: './featured-result-card.component.css',
})
export class FeaturedResultCardComponent {
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
