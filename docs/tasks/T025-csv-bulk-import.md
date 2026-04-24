# T025 — CSV Bulk Import

| | |
|---|---|
| **Slice** | [20 CSV bulk import](../detailed-designs/20-csv-bulk-import/README.md) |
| **L2 traces** | L2-077 |
| **Prerequisites** | T007 |
| **Produces UI** | Yes |

## Objective

Let a user upload a CSV of contacts. Server parses, validates row by row, inserts valid rows, enqueues embedding jobs, and returns `{imported, failed, errors[]}`.

## Scope

**In:**
- `POST /api/import/contacts` accepting `multipart/form-data`.
- `CsvHelper` to parse `displayName, role, organization, emails, phones, tags, location` with `;` for multi-values.
- `ImportPage` at `/import` — drop-zone + summary card + per-row error accordion.

**Out:**
- Dedupe / merge UI.

## ATDD workflow

1. **Red — API**:
   - `Import_500_rows_creates_500_contacts_and_enqueues_embeddings` (L2-077).
   - `Import_with_invalid_rows_reports_per_row_errors` (L2-077).
   - `Import_over_10MB_returns_413` (L2-077).
2. **Red — e2e**:
   - `T025-import.spec.ts` — upload fixture CSV with 5 rows (1 invalid); assert summary `4 imported, 1 failed`; expand errors; assert row 3 error reason; after 10s, a search for one of the imported rows returns it (proves embeddings ran).
3. **Green** — implement endpoint + page.

## Playwright POM

`pages/import.page.ts`:
```ts
export class ImportPage {
  constructor(private page: Page) {}
  async goto() { await this.page.goto('/import'); }
  async uploadFile(path: string) { await this.page.getByLabel('CSV file').setInputFiles(path); }
  async submit() { await this.page.getByRole('button', { name: 'Upload' }).click(); }
  importedCount() { return this.page.getByTestId('imported-count'); }
  failedCount()   { return this.page.getByTestId('failed-count'); }
  async expandErrors() { await this.page.getByRole('button', { name: /see \d+ errors/i }).click(); }
}
```

Add a fixture `e2e/fixtures/sample-contacts.csv`.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] The CSV handler is inside `ImportEndpoints.cs`, ≤ 80 lines.
- [ ] Row size cap of 2048 chars enforced with a clear per-row error.
- [ ] No formula-execution risk: imported fields are rendered via plain Angular binding (no `innerHTML`).

## Screenshot

`docs/tasks/screenshots/T025-import.png` — import page at 375×667 after a successful upload showing the `4 imported / 1 failed` summary.

## Definition of Done

- [ ] 3 API tests + 1 e2e pass.
- [ ] Three verification passes complete clean.
