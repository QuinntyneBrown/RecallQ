import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-search-placeholder-page',
  standalone: true,
  template: `
    <section class="search">
      <h1>Search coming soon</h1>
      <p class="q">Query: {{ q() }}</p>
    </section>
  `,
  styles: [`
    .search { padding: 24px; color: var(--foreground-primary); }
    .q { color: var(--foreground-secondary); }
  `],
})
export class SearchPlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  readonly q = toSignal(
    this.route.queryParamMap.pipe(map(p => p.get('q') ?? '')),
    { initialValue: '' },
  );
}
