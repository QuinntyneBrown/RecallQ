import { Component, Input, Output, EventEmitter } from '@angular/core';

let idCounter = 0;

@Component({
  selector: 'app-input-field',
  standalone: true,
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.css',
})
export class InputFieldComponent {
  @Input({ required: true }) label!: string;
  @Input() type: string = 'text';
  @Input() name: string = '';
  @Input() value: string = '';
  @Input() autocomplete: string | null = null;
  @Output() valueChange = new EventEmitter<string>();

  readonly inputId = `ifld-${++idCounter}`;

  onInput(ev: Event) {
    const v = (ev.target as HTMLInputElement).value;
    this.value = v;
    this.valueChange.emit(v);
  }
}
