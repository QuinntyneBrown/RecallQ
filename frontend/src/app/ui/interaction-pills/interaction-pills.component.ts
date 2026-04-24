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
  template: `
    <span class="row">
      @for (p of pills; track p.label) {
        <span class="pill" [attr.data-type]="p.type">
          <i class="ph" [class]="iconFor(p.type)" aria-hidden="true"></i>
          <span class="label">{{ p.label }}</span>
        </span>
      }
    </span>
  `,
  styles: [`
    .row { display: inline-flex; gap: 6px; flex-wrap: wrap; }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 22px;
      padding: 0 8px;
      border-radius: var(--radius-full);
      font-size: 11px;
      background: color-mix(in srgb, var(--accent-primary) 18%, transparent);
      color: var(--foreground-secondary);
    }
    .pill[data-type="email"]   { background: color-mix(in srgb, var(--accent-primary) 25%, transparent); }
    .pill[data-type="call"]    { background: color-mix(in srgb, var(--success) 25%, transparent); }
    .pill[data-type="meeting"] { background: color-mix(in srgb, var(--accent-secondary) 25%, transparent); }
    .pill[data-type="note"]    { background: color-mix(in srgb, var(--accent-tertiary) 25%, transparent); }
    .pill[data-type="contact"] { background: color-mix(in srgb, var(--foreground-muted) 20%, transparent); }
    .ph { font-size: 12px; }
  `],
})
export class InteractionPillsComponent {
  @Input() pills: InteractionPill[] = [];
  iconFor(t: string) { return ICON_MAP[t] ?? 'ph-circle'; }
}
