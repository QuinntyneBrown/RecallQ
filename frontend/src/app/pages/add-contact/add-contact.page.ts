import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { InputFieldComponent } from '../../ui/input-field/input-field.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import { ContactsService, ContactsValidationError } from '../../contacts/contacts.service';
import { ToastService } from '../../ui/toast/toast.service';

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

@Component({
  selector: 'app-add-contact-page',
  standalone: true,
  imports: [InputFieldComponent, ButtonPrimaryComponent],
  templateUrl: './add-contact.page.html',
  styleUrl: './add-contact.page.css',
})
export class AddContactPage {
  private readonly contacts = inject(ContactsService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly displayName = signal('');
  readonly initials = signal('');
  readonly role = signal('');
  readonly organization = signal('');
  readonly location = signal('');
  readonly tags = signal<string[]>([]);
  readonly tagInput = signal('');
  readonly email = signal('');
  readonly phone = signal('');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly errors = signal<Record<string, string[]>>({});
  private initialsTouched = false;

  fieldError(name: string): string | null {
    const e = this.errors()[name];
    return e && e.length ? e[0] : null;
  }

  onDisplayNameChange(v: string) {
    this.displayName.set(v);
    if (!this.initialsTouched) this.initials.set(deriveInitials(v));
  }

  onInitialsChange(v: string) {
    this.initialsTouched = true;
    this.initials.set(v.slice(0, 3));
  }

  onTagInput(ev: Event) {
    this.tagInput.set((ev.target as HTMLInputElement).value);
  }

  commitTag(ev: Event) {
    ev.preventDefault();
    const v = this.tagInput().trim();
    if (!v) return;
    if (!this.tags().includes(v)) this.tags.set([...this.tags(), v]);
    this.tagInput.set('');
    (ev.target as HTMLInputElement).value = '';
  }

  removeTag(t: string) {
    this.tags.set(this.tags().filter(x => x !== t));
  }

  async onSubmit(ev: Event) {
    ev.preventDefault();
    this.error.set(null);
    this.errors.set({});
    this.busy.set(true);
    try {
      const payload = {
        displayName: this.displayName(),
        initials: this.initials(),
        role: this.role() || null,
        organization: this.organization() || null,
        location: this.location() || null,
        tags: this.tags(),
        emails: this.email() ? [this.email()] : [],
        phones: this.phone() ? [this.phone()] : [],
      };
      const result = await this.contacts.create(payload);
      await this.router.navigateByUrl('/contacts/' + result.id);
      this.toast.show('Contact added');
    } catch (e: any) {
      if (e instanceof ContactsValidationError) this.errors.set(e.errors);
      else this.error.set(e?.message ?? 'error');
    } finally {
      this.busy.set(false);
    }
  }
}
