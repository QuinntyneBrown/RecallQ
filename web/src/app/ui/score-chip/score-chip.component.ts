import { Component, computed, input } from '@angular/core';
import { computeTier } from './score-chip.util';

@Component({
  selector: 'app-score-chip',
  standalone: true,
  template: `
    <span class="chip"
          [class.high]="tier()==='high'"
          [class.mid]="tier()==='mid'"
          [class.low]="tier()==='low'"
          [attr.data-tier]="tier()">{{ rounded().toFixed(2) }}</span>
  `,
  styles: [`
    .chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 28px;
      min-width: 48px;
      padding: 0 10px;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      background: var(--surface-elevated);
      color: var(--foreground-secondary);
    }
    .chip.high {
      background: color-mix(in srgb, var(--success) 18%, transparent);
      color: var(--success);
    }
    .chip.mid {
      background: color-mix(in srgb, var(--accent-secondary) 18%, transparent);
      color: var(--accent-secondary);
    }
    .chip.low {
      background: color-mix(in srgb, var(--foreground-muted) 18%, transparent);
      color: var(--foreground-muted);
    }
  `],
})
export class ScoreChipComponent {
  readonly value = input.required<number>();
  readonly rounded = computed(() => Number(this.value().toFixed(2)));
  readonly tier = computed(() => computeTier(this.rounded()));
}
