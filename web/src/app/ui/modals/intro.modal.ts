import { Component, inject, signal, OnInit } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';
import { ContactDetailDto, ContactDto, ContactsService } from '../../contacts/contacts.service';
import { IntrosService } from '../../intros/intros.service';
import { ToastService } from '../toast/toast.service';
import { navigateExternal } from '../../shared/navigate-external';

export interface IntroModalData {
  contact: ContactDetailDto;
}

@Component({
  selector: 'app-intro-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2 id="intro-modal-title">Draft intro</h2>

    <label for="second-party">Second party</label>
    <input
      id="second-party"
      aria-label="Second party"
      type="text"
      [value]="query()"
      (input)="onQuery($event)"
      autocomplete="off"
    />

    @if (candidates().length && !secondParty()) {
      <ul role="listbox" class="results">
        @for (c of candidates(); track c.id) {
          <li role="option" (click)="pick(c)">{{ c.displayName }}</li>
        }
      </ul>
    }

    @if (secondParty(); as sp) {
      <p class="picked" data-testid="second-party-picked">Picked: {{ sp.displayName }}</p>
    }

    <div class="actions">
      <button type="button" (click)="cancel()">Cancel</button>
      <button type="button" (click)="generate()" [disabled]="!secondParty() || generating()">
        Generate draft
      </button>
    </div>

    @if (generated()) {
      <label for="draft-subject">Subject</label>
      <input id="draft-subject" type="text" readonly [value]="subject()" />

      <label for="draft-body">Draft body</label>
      <textarea
        id="draft-body"
        role="textbox"
        aria-label="Draft body"
        [value]="body()"
        (input)="onBodyInput($event)"
        rows="10"
      ></textarea>

      <div class="actions">
        <button type="button" (click)="copy()">Copy</button>
        <button type="button" (click)="sendEmail()">Send via email</button>
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
      background: var(--surface-elevated);
      color: var(--foreground-primary);
      padding: 20px;
      border-radius: var(--radius-lg);
      min-width: 320px;
      max-width: 560px;
      border: 1px solid var(--border-subtle);
    }
    h2 { margin: 0 0 12px; font-size: 18px; font-family: Geist, system-ui, sans-serif; }
    label { display: block; margin-top: 12px; font-size: 12px; color: var(--foreground-secondary); }
    input, textarea {
      width: 100%;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: var(--surface-primary);
      color: var(--foreground-primary);
      font-size: 14px;
      box-sizing: border-box;
      font-family: inherit;
    }
    textarea { resize: vertical; }
    .results {
      list-style: none; padding: 0; margin: 4px 0 0;
      max-height: 200px; overflow-y: auto;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      background: var(--surface-primary);
    }
    .results li {
      padding: 8px 12px; cursor: pointer;
    }
    .results li:hover { background: var(--surface-elevated); }
    .picked { margin: 8px 0 0; font-size: 13px; color: var(--foreground-secondary); }
    .actions {
      display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;
    }
    button {
      padding: 8px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: var(--surface-primary);
      color: var(--foreground-primary);
      font-size: 14px;
      cursor: pointer;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
})
export class IntroModal implements OnInit {
  private readonly ref = inject<DialogRef<void>>(DialogRef);
  private readonly data = inject<IntroModalData>(DIALOG_DATA);
  private readonly contacts = inject(ContactsService);
  private readonly intros = inject(IntrosService);
  private readonly toast = inject(ToastService);

  readonly query = signal('');
  readonly all = signal<ContactDto[]>([]);
  readonly secondParty = signal<ContactDto | null>(null);
  readonly subject = signal('');
  readonly body = signal('');
  readonly generated = signal(false);
  readonly generating = signal(false);

  async ngOnInit() {
    try {
      const r = await this.contacts.list(1, 50);
      this.all.set(r.items.filter(c => c.id !== this.data.contact.id));
    } catch {
      this.all.set([]);
    }
  }

  candidates() {
    const q = this.query().toLowerCase().trim();
    const items = this.all();
    if (!q) return items.slice(0, 10);
    return items.filter(c => c.displayName.toLowerCase().includes(q)).slice(0, 10);
  }

  onQuery(e: Event) {
    this.query.set((e.target as HTMLInputElement).value);
    this.secondParty.set(null);
  }

  onBodyInput(e: Event) {
    this.body.set((e.target as HTMLTextAreaElement).value);
  }

  pick(c: ContactDto) {
    this.secondParty.set(c);
    this.query.set(c.displayName);
  }

  async generate() {
    const b = this.secondParty();
    if (!b) return;
    this.generating.set(true);
    try {
      const draft = await this.intros.generate(this.data.contact.id, b.id);
      this.subject.set(draft.subject);
      this.body.set(draft.body);
      this.generated.set(true);
    } catch (err: unknown) {
      const msg = (err as Error)?.message === 'intro_rate_limited'
        ? 'Too many intro drafts — try again in a minute'
        : 'Could not generate draft';
      this.toast.show(msg);
    } finally {
      this.generating.set(false);
    }
  }

  async copy() {
    try {
      await navigator.clipboard.writeText(this.body());
      this.toast.show('Draft copied');
    } catch {
      this.toast.show('Draft copied');
    }
  }

  sendEmail() {
    const a = this.data.contact;
    const b = this.secondParty();
    const aEmail = a.emails?.[0] ?? '';
    const bEmail = b?.emails?.[0] ?? '';
    const to = `${aEmail},${bEmail}`;
    const href = `mailto:${to}?subject=${encodeURIComponent(this.subject())}&body=${encodeURIComponent(this.body())}`;
    navigateExternal(href);
  }

  cancel() { this.ref.close(); }
}
