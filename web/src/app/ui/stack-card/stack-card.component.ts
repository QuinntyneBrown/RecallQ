import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StackDto } from '../../stacks/stacks.service';

@Component({
  selector: 'app-stack-card',
  standalone: true,
  template: `
    <a [attr.href]="'/search?stackId=' + stack.id" (click)="nav($event)"
       role="link" data-testid="stack-card" class="stack-card"
       [attr.aria-label]="stack.name">
      <div class="count">{{ displayCount() }}</div>
      <div class="name">{{ stack.name }}</div>
    </a>
  `,
  styles: [`
    .stack-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 140px;
      min-height: 96px;
      padding: 12px 14px;
      border-radius: var(--radius-lg);
      background: var(--surface-elevated);
      border: 1px solid var(--stack-border);
      color: var(--foreground-primary);
      text-decoration: none;
      flex: 0 0 auto;
    }
    .count {
      font-family: 'Geist Mono', ui-monospace, monospace;
      font-size: 28px;
      font-weight: 600;
      line-height: 1;
      color: var(--foreground-primary);
    }
    .name {
      font-size: 13px;
      color: var(--foreground-secondary);
    }
  `],
})
export class StackCardComponent {
  @Input({ required: true }) stack!: StackDto;
  private readonly router = inject(Router);

  displayCount(): string {
    const c = this.stack.count;
    return c > 999 ? '999+' : String(c);
  }

  nav(e: Event): void {
    e.preventDefault();
    void this.router.navigate(['/search'], {
      queryParams: { stackId: this.stack.id, stackName: this.stack.name },
    });
  }
}
