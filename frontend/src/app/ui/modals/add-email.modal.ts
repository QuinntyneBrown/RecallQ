import { Component, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';

export interface AddEmailModalData {
  onSave?: (value: string) => Promise<string | null>;
}

@Component({
  selector: 'app-add-email-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-email.modal.html',
  styleUrl: './add-email.modal.css',
})
export class AddEmailModal {
  private readonly ref = inject<DialogRef<string | undefined>>(DialogRef);
  private readonly data = inject<AddEmailModalData | null>(DIALOG_DATA, { optional: true }) ?? {};
  value = '';
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  onInput(): void {
    if (this.error()) this.error.set(null);
  }

  async save() {
    const v = (this.value ?? '').trim();
    if (!v) return;
    if (!this.data.onSave) {
      this.ref.close(v);
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const err = await this.data.onSave(v);
    this.busy.set(false);
    if (err) {
      this.error.set(err);
      return;
    }
    this.ref.close(v);
  }

  cancel() {
    this.ref.close(undefined);
  }
}
