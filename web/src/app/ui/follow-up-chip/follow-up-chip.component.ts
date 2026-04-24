import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-follow-up-chip',
  standalone: true,
  template: `
    <button type="button" class="chip" data-testid="follow-up-chip" (click)="picked.emit(text)">{{ text }}</button>
  `,
  styles: [`
    .chip {
      background: var(--surface-elevated);
      color: var(--foreground-primary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 6px 14px;
      font-size: 12px;
      cursor: pointer;
      line-height: 1.2;
    }
    .chip:hover { border-color: var(--accent-primary); }
  `],
})
export class FollowUpChipComponent {
  @Input({ required: true }) text!: string;
  @Output() picked = new EventEmitter<string>();
}
