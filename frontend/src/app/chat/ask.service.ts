import { Injectable, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Citation } from '../ui/citation-card/citation-card.component';
import { AuthService } from '../auth/auth.service';

export interface AskMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
  errored?: boolean;
  citations?: Citation[];
  followUps?: string[];
}

@Injectable({ providedIn: 'root' })
export class AskService {
  readonly messages = signal<AskMessage[]>([]);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      if (this.auth.authState() === null) this.reset();
    });
  }

  reset(): void {
    this.messages.set([]);
    this.error.set(null);
    this.pending.set(false);
  }

  private newId(): string {
    return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
  }

  private appendText(id: string, chunk: string): void {
    this.messages.update(list =>
      list.map(m => (m.id === id ? { ...m, text: m.text + chunk } : m)),
    );
  }

  private setCitations(id: string, citations: Citation[]): void {
    this.messages.update(list =>
      list.map(m => (m.id === id ? { ...m, citations } : m)),
    );
  }

  private setFollowUps(id: string, followUps: string[]): void {
    this.messages.update(list =>
      list.map(m => (m.id === id ? { ...m, followUps } : m)),
    );
  }

  private finishStreaming(id: string): void {
    this.messages.update(list =>
      list.map(m => (m.id === id ? { ...m, streaming: false } : m)),
    );
  }

  private markErrored(id: string): void {
    this.messages.update(list =>
      list.map(m => (m.id === id ? { ...m, errored: true, streaming: false } : m)),
    );
  }

  async send(q: string, contactId?: string | null): Promise<void> {
    const trimmed = q.trim();
    if (!trimmed || this.pending()) return;
    this.error.set(null);
    this.pending.set(true);

    const userMsg: AskMessage = { id: this.newId(), role: 'user', text: trimmed };
    const assistantMsg: AskMessage = { id: this.newId(), role: 'assistant', text: '', streaming: true };
    this.messages.update(list => [...list, userMsg, assistantMsg]);

    try {
      const body: { q: string; contactId?: string } = { q: trimmed };
      if (contactId) body.contactId = contactId;
      const res = await fetch('/api/ask', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) {
        if (res.status === 401) {
          this.auth.authState.set(null);
          const url = this.router.url;
          const usable = url && url !== '/' && !url.startsWith('/login');
          const target = usable ? `/login?returnUrl=${encodeURIComponent(url)}` : '/login';
          void this.router.navigateByUrl(target);
          this.finishStreaming(assistantMsg.id);
          return;
        }
        if (res.status === 429) {
          this.error.set('Too many questions — try again in a minute.');
        } else if (res.status === 400) {
          this.error.set('Question is empty or too long.');
        } else {
          this.error.set('Could not reach the assistant. Please try again.');
        }
        this.finishStreaming(assistantMsg.id);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let done = false;
      while (!done) {
        const { value, done: rdDone } = await reader.read();
        if (rdDone) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) >= 0) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          if (!frame) continue;
          let eventName = 'message';
          let data = '';
          for (const line of frame.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice('event:'.length).trim();
            else if (line.startsWith('data:')) data = line.slice('data:'.length).trim();
          }
          if (eventName === 'done') { done = true; break; }
          if (eventName === 'error') {
            this.markErrored(assistantMsg.id);
            done = true;
            break;
          }
          if (eventName === 'followups') {
            try {
              const parsed = JSON.parse(data) as { items?: string[] };
              if (parsed.items?.length) this.setFollowUps(assistantMsg.id, parsed.items);
            } catch { /* ignore */ }
            continue;
          }
          if (eventName === 'citations') {
            try {
              const parsed = JSON.parse(data) as { items?: Citation[] };
              if (parsed.items?.length) this.setCitations(assistantMsg.id, parsed.items);
            } catch { /* ignore */ }
            continue;
          }
          if (!data || data === '{}') continue;
          try {
            const parsed = JSON.parse(data) as { token?: string };
            if (parsed.token) this.appendText(assistantMsg.id, parsed.token);
          } catch { /* ignore malformed */ }
        }
      }
    } catch (e) {
      this.error.set('ask_failed');
    } finally {
      this.finishStreaming(assistantMsg.id);
      this.pending.set(false);
    }
  }
}
