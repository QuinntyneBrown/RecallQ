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
  avatarColorA?: string | null;
  avatarColorB?: string | null;
}

export function avatarBackground(c: { avatarColorA?: string | null; avatarColorB?: string | null }): string | null {
  return c.avatarColorA && c.avatarColorB
    ? `linear-gradient(135deg, ${c.avatarColorA}, ${c.avatarColorB})`
    : null;
}

@Component({
  selector: 'app-result-card',
  standalone: true,
  imports: [ScoreChipComponent, InteractionPillsComponent],
  templateUrl: './result-card.component.html',
  styleUrl: './result-card.component.css',
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

  avatarBackground(): string | null {
    return avatarBackground(this.contact);
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
