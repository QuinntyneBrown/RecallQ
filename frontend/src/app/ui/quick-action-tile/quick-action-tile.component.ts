import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-quick-action-tile',
  standalone: true,
  templateUrl: './quick-action-tile.component.html',
  styleUrl: './quick-action-tile.component.css',
})
export class QuickActionTileComponent {
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) label!: string;
  @Input({ required: true }) ariaLabel!: string;
  @Input() disabled = false;
  @Input() active = false;
  @Input() gradient = false;
  @Output() tileClick = new EventEmitter<void>();

  onClick(event: Event) {
    event.stopPropagation();
    this.tileClick.emit();
  }
}
