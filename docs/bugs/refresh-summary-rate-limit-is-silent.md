# Refresh summary rate-limit response is silent

**Flow:** [27 — Refresh Relationship Summary](../flows/27-refresh-relationship-summary/27-refresh-relationship-summary.md)
**Traces:** L1-008, L2-031.
**Severity:** Medium — the server enforces a 1-refresh-per-60-seconds limit, but the SPA treats the resulting `429 Too Many Requests` identically to `202 Accepted`. The user taps Refresh, sees the "pending" affordance, then nothing changes — no signal that they've been throttled.

## Observed

`frontend/src/app/contacts/contacts.service.ts`:

```ts
async refreshSummary(contactId: string): Promise<void> {
  const res = await fetch(`/api/contacts/${contactId}/summary:refresh`, { method: 'POST', credentials: 'include' });
  if (res.status === 202 || res.status === 429) return;
  throw new Error('refresh_summary_failed_' + res.status);
}
```

The 202 and 429 branches merge, so the page's `onRefreshSummary()` sees success for both. Its catch is empty anyway, and no toast is shown.

## Expected

Per Flow 27 step 3 "Over limit": "`429 Too Many Requests`, SPA shows a toast **'Refresh available in N seconds'**."

## Fix sketch

Split the two statuses in the service:

```ts
if (res.status === 202) return;
if (res.status === 429) throw new Error('rate_limited');
throw new Error('refresh_summary_failed_' + res.status);
```

In `ContactDetailPage.onRefreshSummary()`, branch on `e.message === 'rate_limited'` and call `toast.show('Refresh available in a minute')` (or similar). Keep a generic "Could not refresh summary" fallback for other errors.
