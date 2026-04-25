import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AskService } from '../../chat/ask.service';
import { ContactsService } from '../../contacts/contacts.service';
import { CitationCardComponent } from '../../ui/citation-card/citation-card.component';
import { FollowUpChipComponent } from '../../ui/follow-up-chip/follow-up-chip.component';

@Component({
  selector: 'app-ask-page',
  standalone: true,
  imports: [CitationCardComponent, FollowUpChipComponent],
  templateUrl: './ask.page.html',
  styleUrl: './ask.page.css',
})
export class AskPage implements AfterViewChecked, OnInit {
  private readonly ask = inject(AskService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private readonly contacts = inject(ContactsService);

  readonly messages = this.ask.messages;
  readonly pending = this.ask.pending;
  readonly error = this.ask.error;
  readonly draft = signal('');
  readonly currentContactId = signal<string | null>(null);
  private seededOnce = false;

  @ViewChild('list') list?: ElementRef<HTMLElement>;
  private lastLen = -1;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(async (params) => {
      const contactId = params.get('contactId');
      this.currentContactId.set(contactId);
      if (this.seededOnce || this.messages().length > 0) return;
      if (contactId) {
        this.seededOnce = true;
        try {
          const c = await this.contacts.get(contactId);
          if (c) this.draft.set(`What should I say to ${c.displayName} next?`);
        } catch { /* ignore */ }
        return;
      }
      const q = params.get('q');
      if (q && q.trim()) {
        this.seededOnce = true;
        this.draft.set(q);
      }
    });
  }

  ngAfterViewChecked(): void {
    const len = this.messages().reduce((n, m) => n + m.text.length, 0);
    if (len !== this.lastLen && this.list) {
      this.lastLen = len;
      const el = this.list.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  async submit(input: HTMLInputElement): Promise<void> {
    const q = input.value;
    if (!q.trim() || this.pending()) return;
    input.value = '';
    this.draft.set('');
    await this.ask.send(q, this.currentContactId());
  }

  back(): void { this.location.back(); }

  newSession(): void {
    if (this.ask.messages().length > 0 && !window.confirm('Clear this conversation?')) return;
    this.ask.reset();
    this.draft.set('');
  }

  async handleFollowUp(text: string): Promise<void> {
    await this.ask.send(text, this.currentContactId());
  }
}
