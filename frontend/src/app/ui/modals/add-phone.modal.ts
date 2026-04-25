import { Component, inject } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-phone-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-phone.modal.html',
  styleUrl: './add-phone.modal.css',
})
export class AddPhoneModal {
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
