import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Suggestion } from '../../suggestions/suggestions.service';

@Component({
  selector: 'app-suggestion-card',
  standalone: true,
  template: `
    <article class="sug" data-testid="suggestion-card">
      <div class="row">
        <span class="dot" aria-hidden="true"></span>
        <p class="eyebrow">AI SUGGESTION</p>
      </div>
      <p class="body">{{ suggestion.body }}</p>
      <div class="actions">
        <a [attr.href]="suggestion.actionHref" (click)="nav($event)" role="link" class="primary">{{ suggestion.actionLabel }}</a>
        <button type="button" (click)="dismiss.emit(suggestion.key)" class="ghost">Dismiss</button>
      </div>
    </article>
  `,
  styles: [`
    .sug {
      background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-mid), var(--accent-gradient-end));
      border-radius: var(--radius-lg);
      padding: 16px;
      color: var(--on-accent);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .eyebrow {
      margin: 0;
      font-family: 'Geist Mono', ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.12em;
      opacity: 0.85;
      font-weight: 600;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--on-accent);
      box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.3);
      animation: pulse 1.8s infinite;
      display: inline-block;
    }
    @keyframes pulse {
      0%   { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.5); }
      70%  { box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .dot { animation: none; }
    }
    .body {
      margin: 0;
      font-size: 15px;
      line-height: 1.4;
    }
    .actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .primary {
      background: var(--on-accent);
      color: var(--accent-primary);
      border-radius: var(--radius-full);
      padding: 8px 16px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    .ghost {
      background: transparent;
      color: var(--on-accent);
      border: none;
      font-size: 14px;
      cursor: pointer;
      padding: 8px 4px;
    }
  `],
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
