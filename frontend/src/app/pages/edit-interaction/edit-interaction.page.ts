import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InputFieldComponent } from '../../ui/input-field/input-field.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import { ContactsService } from '../../contacts/contacts.service';
import {
  InteractionsService,
  InteractionsValidationError,
  InteractionTypeValue,
} from '../../interactions/interactions.service';

function pad(n: number): string { return n < 10 ? '0' + n : String(n); }
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface TypeOption { value: InteractionTypeValue; label: string; icon: string; }

@Component({
  selector: 'app-edit-interaction-page',
  standalone: true,
  imports: [InputFieldComponent, ButtonPrimaryComponent],
  templateUrl: './edit-interaction.page.html',
  styleUrl: './edit-interaction.page.css',
})
export class EditInteractionPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contacts = inject(ContactsService);
  private readonly interactions = inject(InteractionsService);

  readonly options: TypeOption[] = [
    { value: 'email', label: 'Email', icon: 'envelope' },
    { value: 'call', label: 'Call', icon: 'phone' },
    { value: 'meeting', label: 'Meeting', icon: 'users' },
    { value: 'note', label: 'Note', icon: 'note' },
  ];

  readonly type = signal<InteractionTypeValue>('note');
  readonly subject = signal('');
  readonly when = signal('');
  readonly content = signal('');
  readonly busy = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  onWhenChange(ev: Event) { this.when.set((ev.target as HTMLInputElement).value); }
  onContentChange(ev: Event) { this.content.set((ev.target as HTMLTextAreaElement).value); }

  async ngOnInit(): Promise<void> {
    const contactId = this.route.snapshot.paramMap.get('id');
    const interactionId = this.route.snapshot.paramMap.get('interactionId');
    if (!contactId || !interactionId) return;
    const contact = await this.contacts.get(contactId);
    const i = contact?.recentInteractions?.find(r => r.id === interactionId);
    if (!i) {
      this.error.set("We couldn't find that interaction.");
      this.loaded.set(true);
      return;
    }
    this.type.set(i.type);
    this.subject.set(i.subject ?? '');
    this.when.set(toLocalInput(i.occurredAt));
    this.content.set(i.content ?? '');
    this.loaded.set(true);
  }

  async onSubmit(ev: Event) {
    ev.preventDefault();
    this.error.set(null);
    this.busy.set(true);
    const contactId = this.route.snapshot.paramMap.get('id');
    const interactionId = this.route.snapshot.paramMap.get('interactionId');
    if (!contactId || !interactionId) { this.busy.set(false); return; }
    try {
      const whenDate = this.when() ? new Date(this.when()) : new Date();
      await this.interactions.patch(interactionId, {
        type: this.type(),
        occurredAt: whenDate.toISOString(),
        subject: this.subject(),
        content: this.content(),
      });
      await this.router.navigateByUrl('/contacts/' + contactId);
    } catch (e: any) {
      if (e instanceof InteractionsValidationError) {
        this.error.set('Please check the form and try again.');
      } else if ((e as Error)?.message === 'patch_failed_404') {
        this.error.set("We couldn't find that interaction.");
      } else {
        this.error.set("We couldn't save that interaction. Please try again.");
      }
    } finally {
      this.busy.set(false);
    }
  }
}
