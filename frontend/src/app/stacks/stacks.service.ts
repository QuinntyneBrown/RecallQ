import { Injectable, signal } from '@angular/core';
import { ContactDto } from '../contacts/contacts.service';

export type StackKind = 'Query' | 'Tag' | 'Classification';

export interface StackDto {
  id: string;
  name: string;
  kind: StackKind;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class StacksService {
  readonly stacks = signal<StackDto[]>([]);

  async refresh(): Promise<void> {
    try {
      const res = await fetch('/api/stacks', { credentials: 'include' });
      if (res.status !== 200) return;
      const body = (await res.json()) as StackDto[];
      this.stacks.set(body.filter((s) => s.count > 0));
    } catch {
      // ignore
    }
  }

  async listContacts(stackId: string): Promise<ContactDto[]> {
    const res = await fetch(`/api/stacks/${stackId}/contacts`, { credentials: 'include' });
    if (res.status !== 200) throw new Error('list_stack_contacts_failed_' + res.status);
    return (await res.json()) as ContactDto[];
  }
}
