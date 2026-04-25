import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InputFieldComponent } from '../../ui/input-field/input-field.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import {
  InteractionsService,
  InteractionsValidationError,
  InteractionTypeValue,
} from '../../interactions/interactions.service';

function pad(n: number): string { return n < 10 ? '0' + n : String(n); }
function nowLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface TypeOption { value: InteractionTypeValue; label: string; icon: string; }

@Component({
  selector: 'app-add-interaction-page',
  standalone: true,
  imports: [InputFieldComponent, ButtonPrimaryComponent],
  templateUrl: './add-interaction.page.html',
  styleUrl: './add-interaction.page.css',
})
export class AddInteractionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly interactions = inject(InteractionsService);

  readonly options: TypeOption[] = [
    { value: 'email', label: 'Email', icon: 'envelope' },
    { value: 'call', label: 'Call', icon: 'phone' },
    { value: 'meeting', label: 'Meeting', icon: 'users' },
    { value: 'note', label: 'Note', icon: 'note' },
  ];

  readonly type = signal<InteractionTypeValue>('note');
  readonly subject = signal('');
  readonly when = signal(nowLocal());
  readonly content = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  onWhenChange(ev: Event) { this.when.set((ev.target as HTMLInputElement).value); }
  onContentChange(ev: Event) { this.content.set((ev.target as HTMLTextAreaElement).value); }

  async onSubmit(ev: Event) {
    ev.preventDefault();
    this.error.set(null);
    this.busy.set(true);
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.busy.set(false); return; }
    try {
      const whenDate = this.when() ? new Date(this.when()) : new Date();
      await this.interactions.create(id, {
        type: this.type(),
        occurredAt: whenDate.toISOString(),
        subject: this.subject() || null,
        content: this.content() || null,
      });
      await this.router.navigateByUrl('/contacts/' + id);
    } catch (e: any) {
      if (e instanceof InteractionsValidationError) this.error.set('Please check the form and try again.');
      else this.error.set(e?.message ?? 'error');
    } finally {
      this.busy.set(false);
    }
  }
}
