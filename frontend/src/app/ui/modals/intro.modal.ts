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
  templateUrl: './intro.modal.html',
  styleUrl: './intro.modal.css',
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
    this.generated.set(false);
    this.subject.set('');
    this.body.set('');
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

  canEmailBoth(): boolean {
    return !!this.data.contact.emails?.[0] && !!this.secondParty()?.emails?.[0];
  }

  sendEmail() {
    if (!this.canEmailBoth()) return;
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
