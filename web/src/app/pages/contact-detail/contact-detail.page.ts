import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ContactsService, ContactDto } from '../../contacts/contacts.service';

@Component({
  selector: 'app-contact-detail-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Contact</h1>
      <p class="soon">coming soon</p>
      @if (contact(); as c) {
        <dl>
          <dt>Display name</dt><dd>{{ c.displayName }}</dd>
          <dt>Initials</dt><dd>{{ c.initials }}</dd>
          @if (c.role) { <dt>Role</dt><dd>{{ c.role }}</dd> }
          @if (c.organization) { <dt>Organization</dt><dd>{{ c.organization }}</dd> }
          @if (c.location) { <dt>Location</dt><dd>{{ c.location }}</dd> }
          @if (c.tags?.length) { <dt>Tags</dt><dd>{{ c.tags.join(', ') }}</dd> }
          @if (c.emails?.length) { <dt>Emails</dt><dd>{{ c.emails.join(', ') }}</dd> }
          @if (c.phones?.length) { <dt>Phones</dt><dd>{{ c.phones.join(', ') }}</dd> }
        </dl>
      }
      @if (notFound()) { <p class="err">Contact not found.</p> }
    </section>
  `,
  styles: [`
    .page { padding: 24px; max-width: 390px; margin: 0 auto; color: var(--foreground-primary); }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .soon { color: var(--foreground-secondary); margin: 0 0 16px; }
    dl { display: grid; grid-template-columns: 120px 1fr; gap: 8px 16px; margin: 0; }
    dt { color: var(--foreground-secondary); font-size: 14px; }
    dd { margin: 0; }
    .err { color: var(--accent-secondary); }
  `],
})
export class ContactDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly contacts = inject(ContactsService);
  readonly contact = signal<ContactDto | null>(null);
  readonly notFound = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    const result = await this.contacts.get(id);
    if (result) this.contact.set(result);
    else this.notFound.set(true);
  }
}
