import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { InputFieldComponent } from '../../ui/input-field/input-field.component';
import { ButtonPrimaryComponent } from '../../ui/button-primary/button-primary.component';
import { ContactsService, ContactsValidationError } from '../../contacts/contacts.service';

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
  template: `
    <section class="page">
      <h1>Add Contact</h1>
      <form (submit)="onSubmit($event)">
        <app-input-field label="Display name" name="displayName"
          [value]="displayName()" (valueChange)="onDisplayNameChange($event)" />
        @if (fieldError('displayName')) { <div class="err" role="alert">{{ fieldError('displayName') }}</div> }

        <app-input-field label="Initials" name="initials"
          [value]="initials()" (valueChange)="onInitialsChange($event)" />
        @if (fieldError('initials')) { <div class="err" role="alert">{{ fieldError('initials') }}</div> }

        <app-input-field label="Role" name="role" [value]="role()" (valueChange)="role.set($event)" />
        <app-input-field label="Organization" name="organization"
          [value]="organization()" (valueChange)="organization.set($event)" />
        <app-input-field label="Location" name="location"
          [value]="location()" (valueChange)="location.set($event)" />

        <div class="chips">
          @for (t of tags(); track t) {
            <span class="chip">{{ t }}<button type="button" (click)="removeTag(t)" aria-label="Remove tag">x</button></span>
          }
        </div>
        <label class="tag-label">Tags
          <input name="tags" [value]="tagInput()" (input)="onTagInput($event)"
            (keydown.enter)="commitTag($event)" />
        </label>

        <app-input-field label="Email" name="email" type="email"
          [value]="email()" (valueChange)="email.set($event)" />
        <app-input-field label="Phone" name="phone"
          [value]="phone()" (valueChange)="phone.set($event)" />

        @if (error()) { <div class="err" role="alert">{{ error() }}</div> }
        <app-button-primary type="submit" [disabled]="busy()">Save</app-button-primary>
      </form>
    </section>
  `,
  styles: [`
    .page {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 24px;
      max-width: 390px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
    h1 { color: var(--foreground-primary); font-size: 28px; margin: 0; }
    form { display: flex; flex-direction: column; gap: 16px; }
    .err { color: var(--accent-secondary); font-size: 14px; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip {
      display: inline-flex; align-items: center; gap: 4px;
      background: var(--surface-elevated); color: var(--foreground-primary);
      border: 1px solid var(--border-subtle); border-radius: var(--radius-full);
      padding: 4px 8px; font-size: 13px;
    }
    .chip button {
      background: transparent; color: inherit; border: 0; cursor: pointer;
      padding: 0 2px; font-size: 12px;
    }
    .tag-label {
      display: flex; flex-direction: column; gap: 8px;
      color: var(--foreground-secondary); font-size: 14px;
    }
    .tag-label input {
      width: 100%; height: 48px; padding: 0 16px;
      background: var(--surface-elevated); border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md); color: var(--foreground-primary);
      font-size: 16px; box-sizing: border-box; outline: none;
    }
  `],
})
export class AddContactPage {
  private readonly contacts = inject(ContactsService);
  private readonly router = inject(Router);

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
    } catch (e: any) {
      if (e instanceof ContactsValidationError) this.errors.set(e.errors);
      else this.error.set(e?.message ?? 'error');
    } finally {
      this.busy.set(false);
    }
  }
}
