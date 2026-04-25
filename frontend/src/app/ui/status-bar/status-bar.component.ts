import { Component } from '@angular/core';

const easternTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

function formatEasternStartTime(date: Date): string {
  const parts = easternTimeFormatter.formatToParts(date);
  const hour = parts.find(part => part.type === 'hour')?.value;
  const minute = parts.find(part => part.type === 'minute')?.value;
  if (hour && minute) return `${hour}:${minute}`;
  return easternTimeFormatter.format(date).replace(/\s?[AP]M$/i, '');
}

@Component({
  selector: 'app-status-bar',
  standalone: true,
  templateUrl: './status-bar.component.html',
  styleUrl: './status-bar.component.css',
})
export class StatusBarComponent {
  readonly easternStartTime = formatEasternStartTime(new Date());
}
