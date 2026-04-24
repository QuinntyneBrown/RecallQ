import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-quick-action-tile',
  standalone: true,
  template: `
    <button
      type="button"
      class="tile"
      [class.active]="active"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel"
      (click)="onClick($event)"
    >
      <i class="ph ph-{{ icon }}" aria-hidden="true"></i>
      <span>{{ label }}</span>
    </button>
  `,
  styles: [`
    :host { display: block; }
    .tile {
      width: 100%;
      aspect-ratio: 1 / 1;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
      padding: 12px;
      background: var(--surface-elevated);
      color: var(--foreground-primary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      font-size: 12px;
      cursor: pointer;
      transition: border-color 120ms ease, transform 120ms ease;
    }
    .tile:disabled { cursor: not-allowed; opacity: 0.55; }
    .tile:not(:disabled):hover { transform: translateY(-1px); }
    .tile.active { border-color: var(--accent-primary); }
    .tile .ph { font-size: 20px; }
  `],
})
export class QuickActionTileComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) ariaLabel!: string;
  @Input() disabled = false;
  @Input() active = false;
  @Output() tileClick = new EventEmitter<void>();

  onClick(event: Event) {
    event.stopPropagation();
    this.tileClick.emit();
  }
}
