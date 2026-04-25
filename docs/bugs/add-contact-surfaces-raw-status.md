# Add contact page surfaces raw `create_failed_<status>`

**Status:** Complete — `add-contact.page.ts` catch now sets the generic alert to `"We couldn't save that contact. Please try again."` for any non-validation failure.
**Flow:** [05 — Create Contact](../flows/05-create-contact/05-create-contact.md)
**Traces:** L1-002, L2-005.
**Severity:** Low-Medium — `frontend/src/app/pages/add-contact/add-contact.page.ts` catches `ContactsValidationError` (per-field errors) but falls back to `e.message` for everything else. `ContactsService.create` throws `'create_failed_' + status` for non-201/400, so a 500 (or any other unhandled status) renders `create_failed_500` literally in the form's general error band.

## Observed

```ts
} catch (e: any) {
  if (e instanceof ContactsValidationError) this.errors.set(e.errors);
  else this.error.set(e?.message ?? 'error');
}
```

```ts
// contacts.service.ts
if (res.status === 201) return (await res.json()) as ContactDto;
if (res.status === 400) {
  const body = await res.json().catch(() => ({}));
  throw new ContactsValidationError(body.errors ?? {});
}
throw new Error('create_failed_' + res.status);
```

The global `installApiInterceptor` already routes 401 to `/login`, so the catch only sees the remaining failure modes — but those still leak the internal identifier.

## Expected

A 500 (or other non-401/400/201 status) should produce `'We couldn\'t save that contact. Please try again.'`.

## Fix sketch

```ts
} catch (e: any) {
  if (e instanceof ContactsValidationError) {
    this.errors.set(e.errors);
  } else {
    this.error.set("We couldn't save that contact. Please try again.");
  }
}
```
