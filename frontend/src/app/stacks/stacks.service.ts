import { Injectable, effect, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
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

  constructor(private http: HttpClient, private auth: AuthService) {
    effect(() => {
      if (this.auth.authState() === null) this.stacks.set([]);
    });
  }

  async refresh(): Promise<void> {
    try {
      const body = await firstValueFrom(
        this.http.get<StackDto[]>('/api/stacks')
      );
      this.stacks.set(body.filter((s) => s.count > 0));
    } catch {
      // ignore
    }
  }

  async listContacts(stackId: string): Promise<ContactDto[]> {
    try {
      return await firstValueFrom(
        this.http.get<ContactDto[]>(`/api/stacks/${stackId}/contacts`)
      );
    } catch (err: any) {
      throw new Error('list_stack_contacts_failed_' + err.status);
    }
  }
}
