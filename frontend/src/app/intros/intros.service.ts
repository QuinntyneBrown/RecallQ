import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface IntroDraft {
  subject: string;
  body: string;
}

export class IntroRateLimitedError extends Error {
  constructor() { super('intro_rate_limited'); }
}

@Injectable({ providedIn: 'root' })
export class IntrosService {
  constructor(private http: HttpClient) {}

  async generate(contactAId: string, contactBId: string): Promise<IntroDraft> {
    try {
      return await firstValueFrom(
        this.http.post<IntroDraft>('/api/intro-drafts', { contactAId, contactBId })
      );
    } catch (err: any) {
      if (err.status === 429) throw new IntroRateLimitedError();
      throw new Error('intro_failed_' + err.status);
    }
  }
}
