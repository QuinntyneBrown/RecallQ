# CSV import does not enforce multi-value caps

**Flow:** 31 — CSV Bulk Import
**Severity:** Medium (data quality, payload abuse)
**Status:** Open

## Symptom

Flow 31 step 4:

> Per row:
> - Validate required `displayName`, **length caps, multi-value caps
>   (10 emails, 10 phones, 20 tags)**.
> - Valid → `ctx.Contacts.Add(...)`.
> - Invalid → append `{ rowIndex, reason }` to the error list.

`backend/RecallQ.Api/Endpoints/ImportContactsMap.cs`'s
`TryBuildContact` validates `displayName` (1–120 chars) but accepts
any number of emails, phones, and tags:

```csharp
contact = new Contact
{
    …
    Tags = Split(row.Tags),
    Emails = Split(row.Emails),
    Phones = Split(row.Phones),
};
return true;
```

A CSV with `emails="a@b.com;c@d.com;…;z@z.com"` (say 50 entries) is
silently accepted and persisted with all 50 values. Same for
phones and tags. That:

- Inflates DB rows (and downstream embedding source text).
- Violates the per-flow contract (Flow 05 lists the same caps for
  the create endpoint, which *does* enforce them at row level
  although neither does today — but the import is the more
  exposed surface).
- Lets a single CSV row carry hundreds of values that downstream
  features (intro modal, summary worker) aren't built for.

## Expected

`TryBuildContact` returns `false` for any row with:

- `> 10` emails →  reason `"emails: max 10"`.
- `> 10` phones →  reason `"phones: max 10"`.
- `> 20` tags →  reason `"tags: max 20"`.

The endpoint already streams these reasons into the
`{ row, reason }` error list, so the user sees them in the SPA's
"See errors" panel (per Flow 31 step 8).

## Actual

No multi-value cap enforcement; rows with 50+ values import
successfully.

## Repro

1. Upload a CSV row with `emails="a@b.com;c@d.com;…"` (11 entries).
2. POST `/api/import/contacts` → response shows `imported: 1,
   failed: 0`. The contact is persisted with all 11 emails.

## Notes

Radically simple fix: in `TryBuildContact`, split the multi-value
fields once, run three length checks, and surface a clear reason
if any cap is exceeded. The endpoint already handles per-row error
collection; the new failures plug into the existing UX.
