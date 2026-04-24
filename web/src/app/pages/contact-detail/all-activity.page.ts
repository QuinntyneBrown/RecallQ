import { Component } from '@angular/core';

@Component({
  selector: 'app-all-activity-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>All activity</h1>
      <p>All activity — coming soon</p>
    </section>
  `,
  styles: [`
    .page { padding: 24px; color: var(--foreground-primary); }
    h1 { font-family: Geist, system-ui, sans-serif; }
    p { color: var(--foreground-secondary); }
  `],
})
export class AllActivityPage {}
