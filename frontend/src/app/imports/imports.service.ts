import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ImportError { row: number; reason: string; }
export interface ImportResult { imported: number; failed: number; errors: ImportError[]; }

export class ImportTooLargeError extends Error {
  constructor() { super('import_too_large'); }
}

@Injectable({ providedIn: 'root' })
export class ImportsService {
  constructor(private http: HttpClient) {}

  async upload(file: File): Promise<ImportResult> {
    try {
      const form = new FormData();
      form.append('file', file, file.name);
      return await firstValueFrom(
        this.http.post<ImportResult>('/api/import/contacts', form)
      );
    } catch (err: any) {
      if (err.status === 413) throw new ImportTooLargeError();
      if (err.status === 400) throw new Error('malformed');
      throw new Error('import_failed_' + err.status);
    }
  }
}
