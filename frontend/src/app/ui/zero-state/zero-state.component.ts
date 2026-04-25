import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-zero-state',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './zero-state.component.html',
  styleUrl: './zero-state.component.css',
})
export class ZeroStateComponent {
  @Input() q: string | null = null;
}
