import { Component } from '@angular/core';

@Component({
  selector: 'app-ask-placeholder-page',
  standalone: true,
  template: `
    <section class="ask">
      <h1>Ask mode</h1>
      <p>Ask mode coming soon.</p>
    </section>
  `,
  styles: [`
    .ask { padding: 24px; color: var(--foreground-primary); }
    p { color: var(--foreground-secondary); }
  `],
})
export class AskPlaceholderPage {}
