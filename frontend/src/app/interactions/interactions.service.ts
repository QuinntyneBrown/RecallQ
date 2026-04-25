import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

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
  constructor(private http: HttpClient) {}

  async list(contactId: string, page = 1, pageSize = 50): Promise<InteractionListResult> {
    try {
      const params = { page: String(page), pageSize: String(pageSize) };
      return await firstValueFrom(
        this.http.get<InteractionListResult>(`/api/contacts/${contactId}/interactions`, { params })
      );
    } catch (err: any) {
      throw new Error('list_failed_' + err.status);
    }
  }

  async create(contactId: string, payload: CreateInteractionPayload): Promise<InteractionDto> {
    try {
      return await firstValueFrom(
        this.http.post<InteractionDto>(`/api/contacts/${contactId}/interactions`, payload)
      );
    } catch (err: any) {
      if (err.status === 400) {
        throw new InteractionsValidationError(err.error?.errors ?? {});
      }
      throw new Error('create_failed_' + err.status);
    }
  }

  async patch(id: string, payload: PatchInteractionPayload): Promise<InteractionDto> {
    try {
      return await firstValueFrom(
        this.http.patch<InteractionDto>(`/api/interactions/${id}`, payload)
      );
    } catch (err: any) {
      if (err.status === 400) {
        throw new InteractionsValidationError(err.error?.errors ?? {});
      }
      throw new Error('patch_failed_' + err.status);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.delete<void>(`/api/interactions/${id}`)
      );
    } catch (err: any) {
      throw new Error('delete_failed_' + err.status);
    }
  }
}
