import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StackDto } from '../../stacks/stacks.service';

@Component({
  selector: 'app-stack-card',
  standalone: true,
  templateUrl: './stack-card.component.html',
  styleUrl: './stack-card.component.css',
})
export class StackCardComponent {
  @Input({ required: true }) stack!: StackDto;
  private readonly router = inject(Router);

  displayCount(): string {
    const c = this.stack.count;
    return c > 999 ? '999+' : String(c);
  }

  ariaLabel(): string {
    return `${this.displayCount()} ${this.stack.name}`;
  }

  nav(e: Event): void {
    e.preventDefault();
    void this.router.navigate(['/search'], {
      queryParams: { stackId: this.stack.id, stackName: this.stack.name },
    });
  }
}
