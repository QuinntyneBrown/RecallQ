import { Component, inject, signal } from '@angular/core';
import { ImportsService, ImportResult, ImportTooLargeError } from '../../imports/imports.service';

@Component({
  selector: 'app-import-page',
  standalone: true,
  templateUrl: './import.page.html',
  styleUrl: './import.page.css',
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
    this.acceptFile(f);
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    const f = ev.dataTransfer?.files?.[0] ?? null;
    this.acceptFile(f);
  }

  private acceptFile(f: File | null): void {
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
