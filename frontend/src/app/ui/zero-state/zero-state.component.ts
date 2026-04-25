import { Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-zero-state',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './zero-state.component.html',
  styleUrl: './zero-state.component.css',
})
export class ZeroStateComponent {
  private readonly router = inject(Router);
  @Input() q: string | null = null;

  editQuery(): void {
    void this.router.navigateByUrl('/home');
  }
}
