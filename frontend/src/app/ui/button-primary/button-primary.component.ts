import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button-primary',
  standalone: true,
  templateUrl: './button-primary.component.html',
  styleUrl: './button-primary.component.css',
})
export class ButtonPrimaryComponent {
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
}
