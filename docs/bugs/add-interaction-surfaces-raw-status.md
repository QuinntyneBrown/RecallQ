# Add interaction page surfaces raw `create_failed_<status>`

**Flow:** [11 — Log Interaction](../flows/11-log-interaction/11-log-interaction.md)
**Traces:** L1-003, L2-010.
**Severity:** Low-Medium — `frontend/src/app/pages/add-interaction/add-interaction.page.ts` catches `InteractionsValidationError` with friendly copy but falls back to printing the raw `e.message` for everything else. `InteractionsService.create` throws `'create_failed_' + status` for non-201/400 responses, so a 404 (foreign contact / deleted mid-flight) or a 500 renders `create_failed_404` literally inside the form — same anti-pattern fixed elsewhere in the SPA.

## Observed

```ts
try {
  await this.interactions.create(id, {...});
  await this.router.navigateByUrl('/contacts/' + id);
} catch (e: any) {
  if (e instanceof InteractionsValidationError) this.error.set('Please check the form and try again.');
  else this.error.set(e?.message ?? 'error');
}
```

```ts
// interactions.service.ts
if (res.status === 201) return (await res.json()) as InteractionDto;
if (res.status === 400) { ... throw new InteractionsValidationError(...); }
throw new Error('create_failed_' + res.status);
```

## Expected

The catch should map specific statuses (404 → "We couldn't find that contact", others → "We couldn't save that interaction") rather than leaking the internal identifier.

## Fix sketch

In `add-interaction.page.ts`, parse the message:

```ts
} catch (e: any) {
  if (e instanceof InteractionsValidationError) {
    this.error.set('Please check the form and try again.');
  } else if ((e as Error)?.message === 'create_failed_404') {
    this.error.set("We couldn't find that contact.");
  } else {
    this.error.set("We couldn't save that interaction. Please try again.");
  }
}
```
