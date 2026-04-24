import { Component, Input, Output, EventEmitter } from '@angular/core';

let idCounter = 0;

@Component({
  selector: 'app-input-field',
  standalone: true,
  template: `
    <div class="field">
      <label [attr.for]="inputId">{{ label }}</label>
      <input
        [id]="inputId"
        [type]="type"
        [name]="name || inputId"
        [value]="value"
        (input)="onInput($event)"
        [attr.autocomplete]="autocomplete"
      />
    </div>
  `,
  styles: [`
    .field {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 100%;
    }
    label {
      color: var(--foreground-secondary);
      font-size: 14px;
    }
    input {
      width: 100%;
      height: 48px;
      padding: 0 16px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      color: var(--foreground-primary);
      font-size: 16px;
      box-sizing: border-box;
      outline: none;
    }
    input:focus-visible {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 2px var(--accent-primary);
    }
  `],
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
