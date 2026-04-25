import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Suggestion } from '../../suggestions/suggestions.service';

@Component({
  selector: 'app-suggestion-card',
  standalone: true,
  templateUrl: './suggestion-card.component.html',
  styleUrl: './suggestion-card.component.css',
})
export class SuggestionCardComponent {
  @Input({ required: true }) suggestion!: Suggestion;
  @Output() dismiss = new EventEmitter<string>();
  private readonly router = inject(Router);

  nav(e: Event): void {
    e.preventDefault();
    void this.router.navigateByUrl(this.suggestion.actionHref);
  }
}
