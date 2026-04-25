import { Component, computed, input } from '@angular/core';
import { computeTier } from './score-chip.util';

@Component({
  selector: 'app-score-chip',
  standalone: true,
  templateUrl: './score-chip.component.html',
  styleUrl: './score-chip.component.css',
})
export class ScoreChipComponent {
  readonly value = input.required<number>();
  readonly rounded = computed(() => Number(this.value().toFixed(2)));
  readonly tier = computed(() => computeTier(this.rounded()));
}
