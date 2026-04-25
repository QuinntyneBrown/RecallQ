import { Injectable, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { InteractionDto } from '../interactions/interactions.service';

export interface ContactDto {
  id: string;
  displayName: string;
  initials: string;
  role: string | null;
  organization: string | null;
  location: string | null;
  tags: string[];
  emails: string[];
  phones: string[];
  avatarColorA: string | null;
  avatarColorB: string | null;
  createdAt: string;
}

export interface ContactDetailDto extends ContactDto {
  starred: boolean;
  recentInteractions: InteractionDto[];
  interactionTotal: number;
}

export interface PatchContactPayload {
  starred?: boolean;
  emails?: string[];
  phones?: string[];
  displayName?: string;
  initials?: string;
  role?: string | null;
  organization?: string | null;
  location?: string | null;
  tags?: string[];
}

export interface CreateContactPayload {
  displayName: string;
  initials: string;
  role?: string | null;
  organization?: string | null;
  location?: string | null;
  tags?: string[];
  emails?: string[];
  phones?: string[];
  avatarColorA?: string | null;
  avatarColorB?: string | null;
}

export interface ContactListResult {
  items: ContactDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ContactCounts {
  contacts: number;
  interactions: number;
}

export type SummaryResponse = {
  status: 'ready' | 'pending' | 'not_enough_data';
  paragraph?: string;
  sentiment?: string;
  interactionCount?: number;
  lastInteractionAt?: string;
  updatedAt?: string;
};

export class ContactsValidationError extends Error {
  constructor(public readonly errors: Record<string, string[]>) {
    super('validation_failed');
  }
}

@Injectable({ providedIn: 'root' })
export class ContactsService {
  readonly contactCount = signal(0);
  readonly interactionCount = signal(0);

  constructor(private http: HttpClient, private auth: AuthService) {
    effect(() => {
      if (this.auth.authState() === null) {
        this.contactCount.set(0);
        this.interactionCount.set(0);
      }
    });
  }

  async create(payload: CreateContactPayload): Promise<ContactDto> {
    try {
      return await firstValueFrom(
        this.http.post<ContactDto>('/api/contacts', payload)
      );
    } catch (err: any) {
      if (err.status === 400) {
        throw new ContactsValidationError(err.error?.errors ?? {});
      }
      throw new Error('create_failed_' + err.status);
    }
  }

  async get(id: string, take?: number): Promise<ContactDetailDto | null> {
    try {
      const params = take ? { take: String(take) } : undefined;
      return await firstValueFrom(
        this.http.get<ContactDetailDto>(`/api/contacts/${id}`, { params })
      );
    } catch (err: any) {
      if (err.status === 404) return null;
      throw new Error('get_failed_' + err.status);
    }
  }

  async patch(id: string, payload: PatchContactPayload): Promise<ContactDetailDto> {
    try {
      return await firstValueFrom(
        this.http.patch<ContactDetailDto>(`/api/contacts/${id}`, payload)
      );
    } catch (err: any) {
      throw new Error('patch_failed_' + err.status);
    }
  }

  async list(page = 1, pageSize = 20, sort = 'createdAt_desc'): Promise<ContactListResult> {
    try {
      const params = { page: String(page), pageSize: String(pageSize), sort };
      return await firstValueFrom(
        this.http.get<ContactListResult>('/api/contacts', { params })
      );
    } catch (err: any) {
      throw new Error('list_failed_' + err.status);
    }
  }

  async count(): Promise<ContactCounts> {
    try {
      return await firstValueFrom(
        this.http.get<ContactCounts>('/api/contacts/count')
      );
    } catch (err: any) {
      throw new Error('count_failed_' + err.status);
    }
  }

  async getSummary(contactId: string): Promise<SummaryResponse> {
    try {
      return await firstValueFrom(
        this.http.get<SummaryResponse>(`/api/contacts/${contactId}/summary`)
      );
    } catch (err: any) {
      throw new Error('summary_failed_' + err.status);
    }
  }

  async refreshSummary(contactId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<void>(`/api/contacts/${contactId}/summary:refresh`, {})
      );
    } catch (err: any) {
      if (err.status === 429) throw new Error('rate_limited');
      throw new Error('refresh_summary_failed_' + err.status);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete<void>(`/api/contacts/${id}`)
      );
    } catch (err: any) {
      throw new Error('delete_failed_' + err.status);
    }
  }

  async refreshCount(): Promise<void> {
    try {
      const c = await this.count();
      this.contactCount.set(c.contacts);
      this.interactionCount.set(c.interactions);
    } catch {
      // leave signals as-is on failure
    }
  }
}
