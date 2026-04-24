import { Injectable, signal } from '@angular/core';

export interface AskMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  streaming?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AskService {
  readonly messages = signal<AskMessage[]>([]);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

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

  private finishStreaming(id: string): void {
    this.messages.update(list =>
      list.map(m => (m.id === id ? { ...m, streaming: false } : m)),
    );
  }

  async send(q: string): Promise<void> {
    const trimmed = q.trim();
    if (!trimmed || this.pending()) return;
    this.error.set(null);
    this.pending.set(true);

    const userMsg: AskMessage = { id: this.newId(), role: 'user', text: trimmed };
    const assistantMsg: AskMessage = { id: this.newId(), role: 'assistant', text: '', streaming: true };
    this.messages.update(list => [...list, userMsg, assistantMsg]);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: trimmed }),
      });
      if (!res.ok || !res.body) {
        this.error.set(`ask_failed_${res.status}`);
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
          if (frame.startsWith('event: done')) { done = true; break; }
          const lines = frame.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const payload = line.slice('data:'.length).trim();
              if (!payload || payload === '{}') continue;
              try {
                const parsed = JSON.parse(payload) as { token?: string };
                if (parsed.token) this.appendText(assistantMsg.id, parsed.token);
              } catch { /* ignore malformed */ }
            }
          }
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
