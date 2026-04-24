import { Injectable } from '@angular/core';

export interface IntroDraft {
  subject: string;
  body: string;
}

export class IntroRateLimitedError extends Error {
  constructor() { super('intro_rate_limited'); }
}

@Injectable({ providedIn: 'root' })
export class IntrosService {
  async generate(contactAId: string, contactBId: string): Promise<IntroDraft> {
    const res = await fetch('/api/intro-drafts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactAId, contactBId }),
    });
    if (res.status === 200) return (await res.json()) as IntroDraft;
    if (res.status === 429) throw new IntroRateLimitedError();
    throw new Error('intro_failed_' + res.status);
  }
}
