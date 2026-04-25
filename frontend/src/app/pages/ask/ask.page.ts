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
  template: `
    <section class="ask-shell">
      <header class="top-bar">
        <button type="button" class="icon-btn" aria-label="Back" (click)="back()">
          <i class="ph ph-arrow-left"></i>
        </button>
        <h1><i class="ph ph-sparkle"></i> Ask RecallQ</h1>
        <button type="button" class="icon-btn" aria-label="New session" (click)="newSession()">
          <i class="ph ph-plus"></i>
        </button>
      </header>

      <div class="chat-list" #list role="log" aria-live="polite" aria-relevant="additions text">
        @if (messages().length === 0) {
          <div data-testid="greet-bubble" class="bubble assistant-bubble">
            Hi — ask me anything about your contacts.
          </div>
        }
        @for (m of messages(); track m.id) {
          @if (m.role === 'user') {
            <div data-testid="user-bubble" class="bubble user-bubble"><span class="sr-only">You said: </span>{{ m.text }}</div>
          } @else {
            <div data-testid="assistant-bubble" class="bubble assistant-bubble" [attr.aria-busy]="m.streaming ? 'true' : null">
              <span class="sr-only">RecallQ said: </span>{{ m.text }}@if (m.streaming) {<span class="cursor">▎</span>}
              @if (m.citations?.length) {
                <div class="citations">
                  @for (c of m.citations; track c.contactId; let i = $index) {
                    <app-citation-card [citation]="c" [top]="i === 0"/>
                  }
                </div>
              }
              @if (m.followUps?.length) {
                <div class="follow-up-section">
                  <p class="follow-up-label">FOLLOW-UP</p>
                  <div class="follow-up-chips">
                    @for (t of m.followUps; track t) {
                      <app-follow-up-chip [text]="t" (picked)="handleFollowUp($event)"/>
                    }
                  </div>
                </div>
              }
            </div>
          }
        }
        @if (error()) {
          <div class="error" role="alert">{{ error() }}</div>
        }
      </div>

      <div class="input-bar" data-testid="input-bar">
        <button type="button" class="icon-btn" aria-label="Add context" disabled>
          <i class="ph ph-plus"></i>
        </button>
        <input #inp type="text" aria-label="Ask anything" placeholder="Ask anything"
               [value]="draft()" (input)="draft.set($any($event.target).value)"
               (keyup.enter)="submit(inp)" [disabled]="pending()" />
        <button type="button" class="icon-btn" aria-label="Voice" disabled>
          <i class="ph ph-microphone"></i>
        </button>
        <button type="button" class="send-btn" aria-label="Send"
                [disabled]="pending()" (click)="submit(inp)">
          <i class="ph ph-paper-plane-tilt"></i>
        </button>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .ask-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      color: var(--foreground-primary);
      background: var(--surface-primary);
    }
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-subtle);
    }
    .top-bar h1 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .icon-btn {
      background: transparent;
      border: 0;
      color: var(--foreground-primary);
      width: 36px;
      height: 36px;
      border-radius: var(--radius-full);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
    }
    .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .icon-btn:hover:not(:disabled) { background: var(--surface-elevated); }
    .chat-list {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .bubble {
      padding: 12px 16px;
      border-radius: var(--radius-lg);
      max-width: 78%;
      line-height: 1.4;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .user-bubble {
      align-self: flex-end;
      background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-end));
      color: var(--foreground-primary);
    }
    .assistant-bubble {
      align-self: flex-start;
      background: var(--surface-elevated);
      color: var(--foreground-primary);
    }
    .cursor {
      display: inline-block;
      margin-left: 2px;
      animation: blink 1s steps(2, start) infinite;
    }
    @keyframes blink { to { visibility: hidden; } }
    .citations { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
    .follow-up-section { margin-top: 12px; }
    .follow-up-label {
      font-family: var(--font-mono, monospace);
      letter-spacing: 1.3px;
      color: var(--foreground-muted);
      font-size: 11px;
      margin: 0 0 6px 0;
    }
    .follow-up-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .error {
      align-self: flex-start;
      color: var(--accent-secondary);
      font-size: 13px;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    .input-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 12px;
      padding-bottom: calc(10px + env(safe-area-inset-bottom));
      border-top: 1px solid var(--border-subtle);
      background: var(--surface-secondary);
      position: sticky;
      bottom: 0;
    }
    .input-bar input {
      flex: 1;
      background: var(--surface-elevated);
      color: var(--foreground-primary);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-full);
      padding: 10px 14px;
      font-size: 14px;
      outline: none;
    }
    .input-bar input::placeholder { color: var(--foreground-muted); }
    .send-btn {
      background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-end));
      border: 0;
      color: var(--foreground-primary);
      width: 40px;
      height: 40px;
      border-radius: var(--radius-full);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
    }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `],
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
  }

  async handleFollowUp(text: string): Promise<void> {
    await this.ask.send(text, this.currentContactId());
  }
}
