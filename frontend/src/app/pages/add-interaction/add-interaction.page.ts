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
  template: `
    <section class="page">
      <h1>Log Interaction</h1>
      <form (submit)="onSubmit($event)">
        <fieldset class="types">
          <legend class="sr-only">Type</legend>
          @for (opt of options; track opt.value) {
            <label class="pill pill-{{opt.value}}" [class.selected]="type() === opt.value">
              <input type="radio" name="type" [value]="opt.value"
                [checked]="type() === opt.value"
                (change)="type.set(opt.value)"
                class="sr-only" />
              <i class="ph ph-{{opt.icon}}" aria-hidden="true"></i>
              <span>{{ opt.label }}</span>
            </label>
          }
        </fieldset>

        <app-input-field label="Subject" name="subject"
          [value]="subject()" (valueChange)="subject.set($event)" />

        <label class="field" for="when">When
          <input id="when" type="datetime-local" name="when"
            [value]="when()" (input)="onWhenChange($event)" />
        </label>

        <label class="field" for="content">Content
          <textarea id="content" name="content" maxlength="8000" rows="6"
            [value]="content()" (input)="onContentChange($event)"></textarea>
        </label>

        @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
        <app-button-primary type="submit" [disabled]="busy()">Save</app-button-primary>
      </form>
    </section>
  `,
  styles: [`
    .page {
      display: flex; flex-direction: column; gap: 16px;
      padding: 24px; max-width: 390px; margin: 0 auto; width: 100%;
      box-sizing: border-box;
    }
    h1 { color: var(--foreground-primary); font-size: 28px; margin: 0; }
    form { display: flex; flex-direction: column; gap: 16px; }
    .types {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
      border: 0; padding: 0; margin: 0;
    }
    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
    }
    .pill {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      padding: 12px 16px; cursor: pointer; user-select: none;
      background: var(--surface-elevated); color: var(--foreground-primary);
      border: 1px solid var(--border-subtle); border-radius: var(--radius-full);
      font-size: 14px;
    }
    .pill i { color: var(--accent-primary); font-size: 18px; }
    .pill.selected {
      background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-mid), var(--accent-gradient-end));
      border-color: transparent; color: var(--foreground-primary);
    }
    .pill.selected i { color: var(--foreground-primary); }
    .field {
      display: flex; flex-direction: column; gap: 8px;
      color: var(--foreground-secondary); font-size: 14px;
    }
    .field input, .field textarea {
      width: 100%; padding: 12px 16px;
      background: var(--surface-elevated); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md); color: var(--foreground-primary);
      font-size: 16px; box-sizing: border-box; outline: none;
      font-family: inherit;
    }
    .field input { height: 48px; }
    .field textarea { resize: vertical; min-height: 120px; }
    .err { color: var(--accent-secondary); font-size: 14px; }
  `],
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
