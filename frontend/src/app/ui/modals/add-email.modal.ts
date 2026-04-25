import { Component, inject, signal } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-email-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-email.modal.html',
  styleUrl: './add-email.modal.css',
})
export class AddEmailModal {
  private readonly ref = inject<DialogRef<string | undefined>>(DialogRef);
  value = '';

  save() {
    const v = (this.value ?? '').trim();
    if (!v) return;
    this.ref.close(v);
  }

  cancel() {
    this.ref.close(undefined);
  }
}
