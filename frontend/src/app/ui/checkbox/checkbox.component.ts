import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  templateUrl: './checkbox.component.html',
  styleUrl: './checkbox.component.css',
})
export class CheckboxComponent {
  @Input() checked = false;
  @Input({ required: true }) label!: string;
  @Input() disabled = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  toggle() {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.checkedChange.emit(this.checked);
  }
}
