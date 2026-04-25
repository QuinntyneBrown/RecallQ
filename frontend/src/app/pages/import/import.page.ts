import { Component, inject, signal } from '@angular/core';
import { ImportsService, ImportResult, ImportTooLargeError } from '../../imports/imports.service';

@Component({
  selector: 'app-import-page',
  standalone: true,
  template: `
    <section class="page">
      <h1>Import Contacts</h1>

      <label for="csv-file" class="drop-zone" data-testid="drop-zone">
        <input id="csv-file" type="file" accept=".csv"
               aria-label="CSV file" (change)="onFileChange($event)" hidden>
        @if (file()) {
          <span>{{ file()!.name }}</span>
        } @else {
          <span>Drag CSV or click to choose</span>
        }
      </label>

      <button type="button" class="upload-btn"
              (click)="submit()" [disabled]="!file() || loading()">
        {{ loading() ? 'Uploading...' : 'Upload' }}
      </button>

      @if (error()) {
        <p class="err" role="alert">{{ error() }}</p>
      }

      @if (result()) {
        <div class="summary">
          <p data-testid="imported-count">{{ result()!.imported }} imported</p>
          <p data-testid="failed-count">{{ result()!.failed }} failed</p>
          @if (result()!.errors && result()!.errors.length) {
            <button type="button" class="errors-toggle"
                    (click)="errorsOpen.set(!errorsOpen())">
              See {{ result()!.errors.length }} errors
            </button>
            @if (errorsOpen()) {
              <ul class="errors-list">
                @for (e of result()!.errors; track e.row) {
                  <li><strong>Row {{ e.row }}</strong> &mdash; {{ e.reason }}</li>
                }
              </ul>
            }
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .page {
      display: flex; flex-direction: column; gap: 16px;
      padding: 24px; max-width: 480px; margin: 0 auto;
      color: var(--foreground-primary);
    }
    h1 { font-size: 24px; margin: 0; }
    .drop-zone {
      display: flex; align-items: center; justify-content: center;
      border: 2px dashed var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 40px 16px;
      background: var(--surface-elevated);
      color: var(--foreground-secondary);
      text-align: center; cursor: pointer;
      font-size: 14px;
    }
    .upload-btn {
      height: 48px; border: 0; border-radius: var(--radius-md);
      background: var(--accent-primary); color: #fff;
      font-size: 15px; font-weight: 600; cursor: pointer;
    }
    .upload-btn[disabled] { opacity: 0.6; cursor: not-allowed; }
    .err { color: var(--accent-secondary); font-size: 14px; margin: 0; }
    .summary { display: flex; flex-direction: column; gap: 8px;
      padding: 16px; background: var(--surface-elevated);
      border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
    .summary p { margin: 0; }
    .errors-toggle {
      align-self: flex-start; background: transparent;
      color: var(--accent-primary); border: 0; cursor: pointer;
      font-size: 14px; padding: 4px 0;
    }
    .errors-list { margin: 0; padding-left: 20px; font-size: 13px; }
  `],
})
export class ImportPage {
  private readonly imports = inject(ImportsService);

  readonly file = signal<File | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly result = signal<ImportResult | null>(null);
  readonly errorsOpen = signal(false);

  onFileChange(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const f = input.files && input.files[0] ? input.files[0] : null;
    this.file.set(f);
    this.result.set(null);
    this.error.set(null);
  }

  async submit(): Promise<void> {
    const f = this.file();
    if (!f) return;
    this.loading.set(true);
    this.error.set(null);
    this.result.set(null);
    try {
      const r = await this.imports.upload(f);
      this.result.set(r);
    } catch (e: unknown) {
      if (e instanceof ImportTooLargeError) {
        this.error.set('File is too large (max 10 MB).');
      } else if ((e as Error)?.message === 'malformed') {
        this.error.set("We couldn't read that file. Make sure it's a CSV.");
      } else {
        this.error.set('Upload failed.');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
