import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-query-chip',
  standalone: true,
  templateUrl: './query-chip.component.html',
  styleUrl: './query-chip.component.css',
})
export class QueryChipComponent {
  @Input({ required: true }) q!: string;
}
