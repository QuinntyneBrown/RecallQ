import { Injectable } from '@angular/core';

export type InteractionTypeValue = 'email' | 'call' | 'meeting' | 'note';

export interface InteractionDto {
  id: string;
  contactId: string;
  type: InteractionTypeValue;
  occurredAt: string;
  subject: string | null;
  content: string;
  createdAt: string;
}

export interface CreateInteractionPayload {
  type: InteractionTypeValue;
  occurredAt: string;
  subject?: string | null;
  content?: string | null;
}

export interface PatchInteractionPayload {
  type?: InteractionTypeValue;
  occurredAt?: string;
  subject?: string | null;
  content?: string | null;
}

export class InteractionsValidationError extends Error {
  constructor(public readonly errors: Record<string, string[]>) {
    super('validation_failed');
  }
}

export interface InteractionListResult {
  items: InteractionDto[];
  nextPage: number | null;
}

@Injectable({ providedIn: 'root' })
export class InteractionsService {
  async list(contactId: string, page = 1, pageSize = 50): Promise<InteractionListResult> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    const res = await fetch(
      `/api/contacts/${contactId}/interactions?${params.toString()}`,
      { credentials: 'include' },
    );
    if (res.status !== 200) throw new Error('list_failed_' + res.status);
    return (await res.json()) as InteractionListResult;
  }

  async create(contactId: string, payload: CreateInteractionPayload): Promise<InteractionDto> {
    const res = await fetch(`/api/contacts/${contactId}/interactions`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 201) return (await res.json()) as InteractionDto;
    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      throw new InteractionsValidationError(body.errors ?? {});
    }
    throw new Error('create_failed_' + res.status);
  }

  async patch(id: string, payload: PatchInteractionPayload): Promise<InteractionDto> {
    const res = await fetch(`/api/interactions/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.status === 200) return (await res.json()) as InteractionDto;
    if (res.status === 400) {
      const body = await res.json().catch(() => ({}));
      throw new InteractionsValidationError(body.errors ?? {});
    }
    throw new Error('patch_failed_' + res.status);
  }

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/interactions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.status !== 204) throw new Error('delete_failed_' + res.status);
  }
}
