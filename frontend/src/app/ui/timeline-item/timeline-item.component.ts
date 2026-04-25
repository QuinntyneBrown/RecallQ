import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InteractionDto, InteractionTypeValue } from '../../interactions/interactions.service';

const ICON_MAP: Record<InteractionTypeValue, string> = {
  email: 'ph-envelope',
  call: 'ph-phone',
  meeting: 'ph-users',
  note: 'ph-note',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function relativeShort(dateIso: string, now: Date = new Date()): string {
  const d = new Date(dateIso);
  const ms = now.getTime() - d.getTime();
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  if (days < 1) return hours < 1 ? 'today' : `${hours}h`;
  if (days < 7) return `${days}d`;
  if (days < 14) return 'last wk';
  if (days < 30) return DAYS[d.getDay()];
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

@Component({
  selector: 'app-timeline-item',
  standalone: true,
  template: `
    <span class="pill" [attr.data-type]="item.type" [attr.aria-label]="'Ix ' + item.type">
      <i class="ph" [class]="iconClass()"></i>
    </span>
    <span class="body">
      <span class="title">{{ titleText() }}</span>
    </span>
    <span class="time">{{ timeLabel() }}</span>
    <button type="button" class="del" aria-label="Delete interaction" (click)="onDelete()">
      <i class="ph ph-trash" aria-hidden="true"></i>
    </button>
  `,
  styles: [`
    :host {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 0;
    }
    .pill {
      width: 32px; height: 32px; border-radius: var(--radius-full);
      display: inline-flex; align-items: center; justify-content: center;
      color: var(--foreground-primary);
      background: var(--surface-elevated);
      flex: 0 0 auto;
    }
    .pill[data-type="email"] { background: color-mix(in srgb, var(--accent-primary) 35%, transparent); }
    .pill[data-type="call"]  { background: color-mix(in srgb, var(--success) 35%, transparent); }
    .pill[data-type="meeting"] { background: color-mix(in srgb, var(--accent-secondary) 35%, transparent); }
    .pill[data-type="note"]  { background: color-mix(in srgb, var(--accent-tertiary) 35%, transparent); }
    .body { flex: 1 1 auto; min-width: 0; }
    .title {
      display: block; font-weight: 600; color: var(--foreground-primary);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .time { color: var(--foreground-secondary); font-size: 12px; flex: 0 0 auto; }
    .ph { font-size: 16px; }
    .del {
      background: transparent; border: 0; cursor: pointer;
      color: var(--foreground-muted);
      padding: 4px 8px;
      border-radius: var(--radius-md);
      flex: 0 0 auto;
    }
    .del:hover, .del:focus-visible { color: var(--accent-secondary); background: color-mix(in srgb, var(--accent-secondary) 12%, transparent); }
    .del .ph { font-size: 16px; }
  `],
})
export class TimelineItemComponent {
  @Input({ required: true }) item!: InteractionDto;
  @Output() delete = new EventEmitter<string>();
  iconClass() { return ICON_MAP[this.item.type] ?? 'ph-note'; }
  titleText() {
    if (this.item.subject && this.item.subject.trim().length) return this.item.subject;
    return (this.item.content || '').slice(0, 60);
  }
  timeLabel() { return relativeShort(this.item.occurredAt); }
  onDelete() { this.delete.emit(this.item.id); }
}
