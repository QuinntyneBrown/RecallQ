import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-follow-up-chip',
  standalone: true,
  templateUrl: './follow-up-chip.component.html',
  styleUrl: './follow-up-chip.component.css',
})
export class FollowUpChipComponent {
  @Input({ required: true }) text!: string;
  @Output() picked = new EventEmitter<string>();
}
