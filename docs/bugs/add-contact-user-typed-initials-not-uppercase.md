# Add contact user-typed initials are not uppercased

**Flow:** [05 — Create Contact](../flows/05-create-contact/05-create-contact.md)
**Traces:** L1-002, L2-005.
**Severity:** Low — `deriveInitials` produces uppercase initials when the visitor types a Display name, but if they then edit the Initials field directly the typed characters are stored as-is. A contact saved with `"ab"` displays a lowercase avatar, breaking the visual consistency of every other contact's all-caps initials chip.

## Observed

`frontend/src/app/pages/add-contact/add-contact.page.ts`:

```ts
function deriveInitials(name: string): string {
  …
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

onInitialsChange(v: string) {
  this.initialsTouched = true;
  this.initials.set(v.slice(0, 3));
}
```

`onInitialsChange` truncates but does not uppercase.

## Expected

Whether initials come from `deriveInitials` or from the visitor typing, they should always be uppercase before they reach the `initials` signal so the avatar and detail chip stay consistent.

## Fix sketch

```ts
onInitialsChange(v: string) {
  this.initialsTouched = true;
  this.initials.set(v.slice(0, 3).toUpperCase());
}
```
