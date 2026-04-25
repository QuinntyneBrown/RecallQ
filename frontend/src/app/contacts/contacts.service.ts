import { Injectable, signal } from '@angular/core';
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

  async create(payload: CreateContactPayload): Promise<ContactDto> {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 201) return (await res.json()) as ContactDto;
    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      throw new ContactsValidationError(body.errors ?? {});
    }
    throw new Error('create_failed_' + res.status);
  }

  async get(id: string): Promise<ContactDetailDto | null> {
    const res = await fetch(`/api/contacts/${id}`, { credentials: 'include' });
    if (res.status === 200) return (await res.json()) as ContactDetailDto;
    if (res.status === 404) return null;
    throw new Error('get_failed_' + res.status);
  }

  async patch(id: string, payload: PatchContactPayload): Promise<ContactDetailDto> {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 200) return (await res.json()) as ContactDetailDto;
    throw new Error('patch_failed_' + res.status);
  }

  async list(page = 1, pageSize = 20, sort = 'createdAt_desc'): Promise<ContactListResult> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort });
    const res = await fetch(`/api/contacts?${params.toString()}`, { credentials: 'include' });
    if (res.status !== 200) throw new Error('list_failed_' + res.status);
    return (await res.json()) as ContactListResult;
  }

  async count(): Promise<ContactCounts> {
    const res = await fetch('/api/contacts/count', { credentials: 'include' });
    if (res.status !== 200) throw new Error('count_failed_' + res.status);
    return (await res.json()) as ContactCounts;
  }

  async getSummary(contactId: string): Promise<SummaryResponse> {
    const res = await fetch(`/api/contacts/${contactId}/summary`, { credentials: 'include' });
    if (res.status !== 200) throw new Error('summary_failed_' + res.status);
    return (await res.json()) as SummaryResponse;
  }

  async refreshSummary(contactId: string): Promise<void> {
    const res = await fetch(`/api/contacts/${contactId}/summary:refresh`, {
      method: 'POST', credentials: 'include',
    });
    if (res.status === 202 || res.status === 429) return;
    throw new Error('refresh_summary_failed_' + res.status);
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/contacts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.status !== 204 && res.status !== 200) {
      throw new Error('delete_failed_' + res.status);
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
