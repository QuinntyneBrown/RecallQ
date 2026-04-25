import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContactsService, ContactDetailDto, SummaryResponse } from '../../contacts/contacts.service';
import { InteractionsService } from '../../interactions/interactions.service';
import { TimelineItemComponent } from '../../ui/timeline-item/timeline-item.component';
import { RelationshipSummaryCardComponent } from '../../ui/relationship-summary-card/relationship-summary-card.component';
import { QuickActionTileComponent } from '../../ui/quick-action-tile/quick-action-tile.component';
import { Dialog } from '@angular/cdk/dialog';
import { AddEmailModal } from '../../ui/modals/add-email.modal';
import { AddPhoneModal } from '../../ui/modals/add-phone.modal';
import { IntroModal } from '../../ui/modals/intro.modal';
import { ToastService } from '../../ui/toast/toast.service';
import { BreakpointService } from '../../shell/breakpoint.service';
import { navigateExternal } from '../../shared/navigate-external';

@Component({
  selector: 'app-contact-detail-page',
  standalone: true,
  imports: [TimelineItemComponent, RelationshipSummaryCardComponent, QuickActionTileComponent, RouterLink],
  templateUrl: './contact-detail.page.html',
  styleUrl: './contact-detail.page.css',
})
export class ContactDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contacts = inject(ContactsService);
  private readonly interactions = inject(InteractionsService);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);
  private readonly breakpoints = inject(BreakpointService);
  readonly contact = signal<ContactDetailDto | null>(null);
  readonly notFound = signal(false);
  readonly contactId = signal<string | null>(null);
  readonly summary = signal<SummaryResponse>({ status: 'pending' });
  readonly refreshing = signal(false);
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  readonly starred = computed(() => this.contact()?.starred ?? false);
  readonly hasEmail = computed(() => (this.contact()?.emails?.length ?? 0) > 0);
  readonly hasPhone = computed(() => (this.contact()?.phones?.length ?? 0) > 0);
  readonly roleLine = computed(() => {
    const c = this.contact();
    if (!c) return '';
    const parts = [c.role, c.organization].filter(p => p && p.trim().length);
    return parts.join(' · ');
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.contactId.set(id);
    const result = await this.contacts.get(id);
    if (result) {
      this.contact.set(result);
      this.loadSummary();
    } else this.notFound.set(true);
  }

  private async loadSummary(attempt = 0) {
    const id = this.contactId();
    if (!id) return;
    try {
      const s = await this.contacts.getSummary(id);
      if (s.status !== 'pending' || this.summary().status !== 'ready') {
        this.summary.set(s);
      }
      if (s.status === 'pending' && attempt < 10) {
        this.pollTimer = setTimeout(() => this.loadSummary(attempt + 1), 1500);
      } else {
        this.refreshing.set(false);
      }
    } catch {
      this.refreshing.set(false);
    }
  }

  async onRefreshSummary() {
    const id = this.contactId();
    if (!id) return;
    this.refreshing.set(true);
    try {
      await this.contacts.refreshSummary(id);
    } catch (e: any) {
      this.refreshing.set(false);
      if (e?.message === 'rate_limited') {
        this.toast.show('Refresh available in a minute');
      } else {
        this.toast.show('Could not refresh summary');
      }
      return;
    }
    this.loadSummary(0);
  }

  back() { history.back(); }

  onAskAi() {
    const c = this.contact();
    if (!c) return;
    this.router.navigate(['/ask'], { queryParams: { contactId: c.id } });
  }

  onIntro() {
    const c = this.contact();
    if (!c) return;
    this.dialog.open<void>(IntroModal, {
      data: { contact: c },
      ariaLabelledBy: 'intro-modal-title',
    });
  }

  private navigateExternal(href: string) {
    navigateExternal(href);
  }

  async onMessage() {
    const c = this.contact();
    if (!c) return;
    if (this.hasEmail()) {
      this.navigateExternal('mailto:' + c.emails[0]);
      return;
    }
    const ref = this.dialog.open<string | undefined>(AddEmailModal, {
      ariaLabelledBy: 'add-email-title',
      data: {
        onSave: async (v: string): Promise<string | null> => {
          try {
            const updated = await this.contacts.patch(c.id, { emails: [v] });
            this.contact.set(updated);
            return null;
          } catch (e: any) {
            return e?.message === 'patch_failed_400'
              ? 'That email looks invalid'
              : 'Could not update contact';
          }
        },
      },
    });
    ref.closed.subscribe((value) => {
      if ((value ?? '').trim()) this.onMessage();
    });
  }

  async onCall() {
    const c = this.contact();
    if (!c) return;
    if (!this.hasPhone()) {
      const ref = this.dialog.open<string | undefined>(AddPhoneModal, {
        ariaLabelledBy: 'add-phone-title',
        data: {
          onSave: async (v: string): Promise<string | null> => {
            try {
              const updated = await this.contacts.patch(c.id, { phones: [v] });
              this.contact.set(updated);
              return null;
            } catch (e: any) {
              return e?.message === 'patch_failed_400'
                ? 'That phone number looks invalid'
                : 'Could not update contact';
            }
          },
        },
      });
      ref.closed.subscribe((value) => {
        if ((value ?? '').trim()) this.onCall();
      });
      return;
    }
    const phone = c.phones[0];
    if (!this.breakpoints.md()) {
      this.navigateExternal('tel:' + phone);
    } else {
      try {
        await navigator.clipboard.writeText(phone);
        this.toast.show('Phone number copied');
      } catch {
        this.toast.show(`Couldn't copy — call ${phone}`);
      }
    }
  }

  async toggleStar() {
    const c = this.contact();
    if (!c) return;
    const next = !c.starred;
    this.contact.set({ ...c, starred: next });
    try {
      const updated = await this.contacts.patch(c.id, { starred: next });
      this.contact.set(updated);
    } catch {
      this.contact.set(c);
      this.toast.show('Could not update star');
    }
  }

  onLogInteraction() {
    const id = this.contactId();
    if (!id) return;
    void this.router.navigate(['/contacts', id, 'interactions', 'new']);
  }

  onEditInteraction(interactionId: string) {
    const id = this.contactId();
    if (!id) return;
    void this.router.navigate(['/contacts', id, 'interactions', interactionId, 'edit']);
  }

  async onDeleteInteraction(interactionId: string) {
    if (!window.confirm('Delete this interaction?')) return;
    try {
      await this.interactions.delete(interactionId);
      const cid = this.contactId();
      if (cid) {
        const refreshed = await this.contacts.get(cid);
        if (refreshed) this.contact.set(refreshed);
      }
    } catch {
      this.toast.show('Could not delete interaction');
    }
  }

  async deleteContact() {
    const c = this.contact();
    if (!c) return;
    if (!window.confirm('Delete this contact? This cannot be undone.')) return;
    try {
      await this.contacts.delete(c.id);
      this.toast.show('Contact deleted');
      await this.router.navigateByUrl('/home');
    } catch {
      this.toast.show('Could not delete contact');
    }
  }
}
