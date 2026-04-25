import { Component, Input } from '@angular/core';

export interface InteractionPill {
  type: 'email' | 'call' | 'meeting' | 'note' | 'contact';
  label: string;
}

const ICON_MAP: Record<string, string> = {
  email: 'ph-envelope',
  call: 'ph-phone',
  meeting: 'ph-users',
  note: 'ph-note',
  contact: 'ph-user',
};

@Component({
  selector: 'app-interaction-pills',
  standalone: true,
  templateUrl: './interaction-pills.component.html',
  styleUrl: './interaction-pills.component.css',
})
export class InteractionPillsComponent {
  @Input() pills: InteractionPill[] = [];
  iconFor(t: string) { return ICON_MAP[t] ?? 'ph-circle'; }
}
