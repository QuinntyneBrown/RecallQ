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
  templateUrl: './timeline-item.component.html',
  styleUrl: './timeline-item.component.css',
})
export class TimelineItemComponent {
  @Input({ required: true }) item!: InteractionDto;
  @Output() delete = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  iconClass() { return ICON_MAP[this.item.type] ?? 'ph-note'; }
  typeLabel(): string {
    const t = this.item.type;
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  titleText() {
    if (this.item.subject && this.item.subject.trim().length) return this.item.subject;
    return (this.item.content || '').slice(0, 60);
  }
  timeLabel() { return relativeShort(this.item.occurredAt); }
  onDelete() { this.delete.emit(this.item.id); }
  onEdit() { this.edit.emit(this.item.id); }
}
