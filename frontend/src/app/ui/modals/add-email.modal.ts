import { Component, inject, signal } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-email-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h2 id="add-email-title">Add email</h2>
    <form (ngSubmit)="save()">
      <input
        type="email"
        aria-label="Email"
        required
        [(ngModel)]="value"
        name="email"
        autofocus
      />
      <div class="actions">
        <button type="button" (click)="cancel()">Cancel</button>
        <button type="submit">Save</button>
      </div>
    </form>
  `,
  styles: [`
    :host {
      display: block;
      background: var(--surface-elevated);
      color: var(--foreground-primary);
      padding: 20px;
      border-radius: var(--radius-lg);
      min-width: 280px;
      border: 1px solid var(--border-subtle);
    }
    h2 { margin: 0 0 12px; font-size: 18px; font-family: Geist, system-ui, sans-serif; }
    input {
      width: 100%;
      padding: 10px 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: var(--surface-primary);
      color: var(--foreground-primary);
      font-size: 14px;
      box-sizing: border-box;
    }
    .actions {
      display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;
    }
    button {
      padding: 8px 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: var(--surface-primary);
      color: var(--foreground-primary);
      font-size: 14px;
      cursor: pointer;
    }
    button[type="submit"] {
      background: var(--accent-primary);
      color: var(--foreground-primary);
      border-color: var(--accent-primary);
    }
  `],
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
