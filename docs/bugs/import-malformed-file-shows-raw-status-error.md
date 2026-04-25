# Import malformed file shows raw `import_failed_400`

**Flow:** [31 — CSV Bulk Import](../flows/31-csv-bulk-import/31-csv-bulk-import.md)
**Traces:** L1-018, L2-077.
**Severity:** Medium — when the server rejects a non-CSV / wrong-encoding upload with `400 Bad Request`, the SPA renders the raw identifier `import_failed_400`, breaking the "descriptive error" promise from Flow 31's alternatives section.

## Observed

`frontend/src/app/imports/imports.service.ts`:

```ts
if (res.status === 413) throw new ImportTooLargeError();
if (!res.ok) throw new Error('import_failed_' + res.status);
```

Every non-413 / non-2xx — including `400 Malformed file` — falls through to the `import_failed_<status>` `Error`. `import.page.ts` then prints `e.message` raw:

```ts
this.error.set((e as Error)?.message ?? 'Upload failed.');
```

## Expected

Per Flow 31 alternatives: "Malformed file (not CSV, wrong encoding) → `400 Bad Request` with a **descriptive error**." The `413` path (file too large) is already friendly; the `400` path should match.

## Fix sketch

1. In `imports.service.ts` add a `if (res.status === 400) throw new Error('malformed');` branch above the catch-all.
2. In `import.page.ts`, branch on `(e as Error)?.message === 'malformed'` and render `"We couldn't read that file. Make sure it's a CSV."` Keep `'Upload failed.'` as the generic catch-all for other statuses.
