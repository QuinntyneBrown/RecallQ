import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ContactsService, ContactDetailDto, SummaryResponse } from '../../contacts/contacts.service';
import { TimelineItemComponent } from '../../ui/timeline-item/timeline-item.component';
import { RelationshipSummaryCardComponent } from '../../ui/relationship-summary-card/relationship-summary-card.component';
import { QuickActionTileComponent } from '../../ui/quick-action-tile/quick-action-tile.component';
import { Dialog } from '@angular/cdk/dialog';
import { AddEmailModal } from '../../ui/modals/add-email.modal';
import { AddPhoneModal } from '../../ui/modals/add-phone.modal';
import { IntroModal } from '../../ui/modals/intro.modal';
import { ToastService } from '../../ui/toast/toast.service';
import { navigateExternal } from '../../shared/navigate-external';

@Component({
  selector: 'app-contact-detail-page',
  standalone: true,
  imports: [TimelineItemComponent, RelationshipSummaryCardComponent, QuickActionTileComponent],
  template: `
    <section class="page">
      @if (contact(); as c) {
        <header class="hero">
          <div class="topbar">
            <button type="button" class="icon-btn" aria-label="Back" (click)="back()">
              <i class="ph ph-caret-left"></i>
            </button>
            <div class="spacer"></div>
            <button type="button" class="icon-btn" aria-label="Star contact" (click)="toggleStar()">
              <i class="ph"
                 [class.ph-star]="!starred()"
                 [class.ph-star-fill]="starred()"
                 [style.color]="starred() ? 'var(--star-fill)' : 'var(--foreground-primary)'"></i>
            </button>
            <button type="button" class="icon-btn" aria-label="Delete contact" (click)="deleteContact()">
              <i class="ph ph-dots-three"></i>
            </button>
          </div>

          <div class="hero-content">
            <div class="avatar" data-testid="hero-avatar">{{ c.initials }}</div>
            <h1 data-testid="hero-name">{{ c.displayName }}</h1>
            @if (roleLine()) {
              <p data-testid="hero-role">{{ roleLine() }}</p>
            }
            @if (c.tags?.length) {
              <ul data-testid="hero-tags" role="list" class="chips">
                @for (tag of c.tags; track tag) {
                  <li role="listitem"><span class="chip">{{ tag }}</span></li>
                }
              </ul>
            }
          </div>
        </header>

        <div class="actions">
          <app-quick-action-tile
            icon="envelope"
            label="Message"
            ariaLabel="Email this contact"
            [active]="hasEmail()"
            (tileClick)="onMessage()"
          />
          <app-quick-action-tile
            icon="phone"
            label="Call"
            ariaLabel="Call this contact"
            [active]="hasPhone()"
            (tileClick)="onCall()"
          />
          <app-quick-action-tile
            icon="users"
            label="Intro"
            ariaLabel="Draft intro"
            (tileClick)="onIntro()"
          />
          <app-quick-action-tile
            icon="sparkle"
            label="Ask AI"
            ariaLabel="Ask AI about this contact"
            [gradient]="true"
            (tileClick)="onAskAi()"
          />
        </div>

        <div class="summary-wrap">
          <app-relationship-summary-card [summary]="summary()" (refresh)="onRefreshSummary()" />
        </div>

        <section class="activity">
          <div class="activity-head">
            <h2>Recent activity</h2>
            <div class="activity-actions">
              <button type="button" class="log-btn" aria-label="Log interaction" (click)="onLogInteraction()">
                <i class="ph ph-plus" aria-hidden="true"></i>
                Log
              </button>
              @if (c.interactionTotal > 3) {
                <a [attr.href]="'/contacts/' + c.id + '/activity'" role="link">See all {{ c.interactionTotal }}</a>
              }
            </div>
          </div>
          @if (c.recentInteractions?.length) {
            <ul data-testid="timeline" role="list" class="timeline">
              @for (item of c.recentInteractions; track item.id) {
                <li role="listitem" class="timeline-item">
                  <app-timeline-item [item]="item"></app-timeline-item>
                </li>
              }
            </ul>
          } @else {
            <p class="empty">No interactions yet.</p>
          }
        </section>
      } @else if (notFound()) {
        <p class="err">Contact not found.</p>
      }
    </section>
  `,
  styles: [`
    .page {
      max-width: 390px; margin: 0 auto;
      color: var(--foreground-primary);
      display: flex; flex-direction: column; gap: 16px;
      padding-bottom: 24px;
    }
    .hero {
      position: relative;
      min-height: 260px;
      padding: 56px 24px 24px;
      border-bottom-left-radius: 32px;
      border-bottom-right-radius: 32px;
      background: linear-gradient(180deg,
        var(--hero-from) 0%,
        var(--hero-mid) 60%,
        var(--hero-to) 100%);
      overflow: hidden;
    }
    .topbar {
      position: absolute; top: 12px; left: 12px; right: 12px;
      display: flex; align-items: center; gap: 8px;
    }
    .topbar .spacer { flex: 1 1 auto; }
    .icon-btn {
      width: 36px; height: 36px; border: 0; background: transparent;
      color: var(--foreground-primary); border-radius: var(--radius-full);
      display: inline-flex; align-items: center; justify-content: center;
      cursor: pointer;
    }
    .icon-btn:hover { background: rgba(255,255,255,0.1); }
    .icon-btn .ph { font-size: 22px; }
    .hero-content { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 8px; }
    .avatar {
      width: 96px; height: 96px; border-radius: var(--radius-full);
      background: linear-gradient(var(--accent-gradient-start), var(--accent-gradient-end));
      display: flex; align-items: center; justify-content: center;
      color: var(--foreground-primary);
      font-family: Geist, system-ui, sans-serif;
      font-weight: 700; font-size: 28px;
    }
    h1 { margin: 8px 0 0; font-family: Geist, system-ui, sans-serif; font-size: 28px; color: var(--foreground-primary); }
    [data-testid="hero-role"] { margin: 0; color: var(--foreground-primary); opacity: 0.9; font-size: 14px; }
    .chips {
      list-style: none; padding: 0; margin: 8px 0 0;
      display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;
    }
    .chip {
      display: inline-block;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      background: rgba(255,255,255,0.15);
      color: var(--foreground-primary);
      font-size: 12px;
    }
    .actions {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
      padding: 0 24px;
    }
    .summary-wrap { padding: 0 24px; }
    .activity { padding: 0 24px; }
    .activity-head {
      display: flex; align-items: baseline; justify-content: space-between;
      margin-bottom: 8px;
    }
    .activity-head h2 { margin: 0; font-size: 18px; font-family: Geist, system-ui, sans-serif; }
    .activity-head a { color: var(--accent-primary); text-decoration: none; font-size: 14px; }
    .activity-actions {
      display: flex; align-items: center; gap: 16px;
    }
    .log-btn {
      background: transparent;
      border: 0;
      color: var(--accent-primary);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex; align-items: center; gap: 4px;
      padding: 4px 8px;
      border-radius: var(--radius-md);
    }
    .log-btn:hover, .log-btn:focus-visible { background: color-mix(in srgb, var(--accent-primary) 10%, transparent); }
    .log-btn .ph { font-size: 16px; }
    .timeline { list-style: none; padding: 0; margin: 0; }
    .timeline-item { border-bottom: 1px solid var(--border-subtle); }
    .timeline-item:last-child { border-bottom: 0; }
    .empty { color: var(--foreground-secondary); }
    .err { color: var(--accent-secondary); padding: 24px; }
  `],
})
export class ContactDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contacts = inject(ContactsService);
  private readonly dialog = inject(Dialog);
  private readonly toast = inject(ToastService);
  readonly contact = signal<ContactDetailDto | null>(null);
  readonly notFound = signal(false);
  readonly contactId = signal<string | null>(null);
  readonly summary = signal<SummaryResponse>({ status: 'pending' });
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
      this.summary.set(s);
      if (s.status === 'pending' && attempt < 10) {
        this.pollTimer = setTimeout(() => this.loadSummary(attempt + 1), 3000);
      }
    } catch {
      // leave as-is
    }
  }

  async onRefreshSummary() {
    const id = this.contactId();
    if (!id) return;
    this.summary.set({ status: 'pending' });
    try { await this.contacts.refreshSummary(id); } catch {}
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
    });
    ref.closed.subscribe(async (value) => {
      const v = (value ?? '').trim();
      if (!v) return;
      try {
        const updated = await this.contacts.patch(c.id, { emails: [v] });
        this.contact.set(updated);
        this.onMessage();
      } catch {}
    });
  }

  async onCall() {
    const c = this.contact();
    if (!c) return;
    if (!this.hasPhone()) {
      const ref = this.dialog.open<string | undefined>(AddPhoneModal, {
        ariaLabelledBy: 'add-phone-title',
      });
      ref.closed.subscribe(async (value) => {
        const v = (value ?? '').trim();
        if (!v) return;
        try {
          const updated = await this.contacts.patch(c.id, { phones: [v] });
          this.contact.set(updated);
          this.onCall();
        } catch {}
      });
      return;
    }
    const phone = c.phones[0];
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile) {
      this.navigateExternal('tel:' + phone);
    } else {
      try {
        await navigator.clipboard.writeText(phone);
        this.toast.show('Phone number copied');
      } catch {
        this.toast.show('Phone number copied');
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
