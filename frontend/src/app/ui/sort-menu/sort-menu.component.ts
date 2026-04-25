import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { Sort } from '../../search/sort.util';

@Component({
  selector: 'app-sort-menu',
  standalone: true,
  template: `
    <div class="wrap">
      <button
        type="button"
        class="chip"
        aria-label="Sort"
        aria-haspopup="menu"
        [attr.aria-expanded]="open()"
        [disabled]="disabled"
        data-testid="sort-menu-trigger"
        (click)="toggle()"
      >
        Sort · {{ label() }}
      </button>
      @if (open()) {
        <div class="menu" role="menu" data-testid="sort-menu">
          <button type="button" role="menuitem" class="item" (click)="pick('similarity')">Similarity</button>
          <button type="button" role="menuitem" class="item" (click)="pick('recent')">Most recent</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .wrap { position: relative; display: inline-block; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px;
      background: var(--surface-elevated);
      color: var(--foreground-primary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      font-size: 13px;
      cursor: pointer;
    }
    .chip:disabled { opacity: 0.5; cursor: not-allowed; }
    .menu {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 160px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 4px;
      display: flex;
      flex-direction: column;
      z-index: 10;
      box-shadow: 0 8px 20px rgba(0,0,0,.25);
    }
    .item {
      text-align: left;
      background: transparent;
      color: var(--foreground-primary);
      border: 0;
      padding: 8px 10px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      cursor: pointer;
    }
    .item:hover { background: color-mix(in srgb, var(--foreground-primary) 8%, transparent); }
  `],
})
export class SortMenuComponent {
  private readonly _sort = signal<Sort>('similarity');
  @Input({ required: true }) set sort(v: Sort) { this._sort.set(v); }
  get sort(): Sort { return this._sort(); }
  @Input() disabled = false;
  @Output() sortChange = new EventEmitter<Sort>();

  readonly open = signal(false);
  readonly label = computed(() => (this._sort() === 'recent' ? 'Most recent' : 'Similarity'));

  toggle(): void {
    if (this.disabled) return;
    this.open.update(v => !v);
  }

  pick(s: Sort): void {
    if (this.disabled) return;
    this.open.set(false);
    this.sortChange.emit(s);
  }
}
