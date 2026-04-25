import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { Sort } from '../../search/sort.util';

@Component({
  selector: 'app-sort-menu',
  standalone: true,
  templateUrl: './sort-menu.component.html',
  styleUrl: './sort-menu.component.css',
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
