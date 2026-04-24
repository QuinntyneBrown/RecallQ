import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button-primary',
  standalone: true,
  template: `
    <button [type]="type" [disabled]="disabled">
      <ng-content/>
    </button>
  `,
  styles: [`
    button {
      height: 48px;
      padding: 0 24px;
      border: 0;
      border-radius: var(--radius-full);
      color: #fff;
      background: linear-gradient(
        var(--accent-gradient-start),
        var(--accent-gradient-mid),
        var(--accent-gradient-end)
      );
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(124, 58, 255, 0.35);
      width: 100%;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `],
})
export class ButtonPrimaryComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
}
