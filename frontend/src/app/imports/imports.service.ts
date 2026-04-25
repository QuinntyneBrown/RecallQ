import { Injectable } from '@angular/core';

export interface ImportError { row: number; reason: string; }
export interface ImportResult { imported: number; failed: number; errors: ImportError[]; }

export class ImportTooLargeError extends Error {
  constructor() { super('import_too_large'); }
}

@Injectable({ providedIn: 'root' })
export class ImportsService {
  async upload(file: File): Promise<ImportResult> {
    const form = new FormData();
    form.append('file', file, file.name);
    const res = await fetch('/api/import/contacts', {
      method: 'POST',
      credentials: 'include',
      body: form,
    });
    if (res.status === 413) throw new ImportTooLargeError();
    if (res.status === 400) throw new Error('malformed');
    if (!res.ok) throw new Error('import_failed_' + res.status);
    return (await res.json()) as ImportResult;
  }
}
