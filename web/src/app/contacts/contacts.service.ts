import { Injectable } from '@angular/core';

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

export class ContactsValidationError extends Error {
  constructor(public readonly errors: Record<string, string[]>) {
    super('validation_failed');
  }
}

@Injectable({ providedIn: 'root' })
export class ContactsService {
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

  async get(id: string): Promise<ContactDto | null> {
    const res = await fetch(`/api/contacts/${id}`, { credentials: 'include' });
    if (res.status === 200) return (await res.json()) as ContactDto;
    if (res.status === 404) return null;
    throw new Error('get_failed_' + res.status);
  }
}
