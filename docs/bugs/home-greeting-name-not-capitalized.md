# Home greeting name uses raw lowercase email local-part

**Flow:** [06 — List Contacts](../flows/06-list-contacts/06-list-contacts.md) (audited via Flow 28 home shell)
**Traces:** L1-002.
**Severity:** Low — `docs/ui-design.pen` (home frame `SZRuv`) shows the greeting as `Good morning, Quinn`. The implementation pulls the part before `@` from the email and prints it as-is, so a visitor whose email is `quinn@example.com` sees the lowercase `Good morning, quinn`.

## Observed

`frontend/src/app/pages/home/home.page.ts`:

```ts
readonly greetingName = computed(() => {
  const s = this.auth.authState();
  if (!s) return '';
  return s.email.split('@')[0];
});
```

The signal value is interpolated directly into `<p class="greeting">Good {{ timeOfDay() }}, {{ greetingName() }}</p>`.

## Expected

Greet the visitor with the local-part as a proper noun: capitalise the first letter so `quinn@example.com` → `Quinn`. Multi-segment local parts (`john.doe`) keep the trailing characters untouched in v1 — title-casing on every dot is out of scope and would still mishandle name initials. The first-letter capitalise is enough to match the design's example.

## Fix sketch

```ts
readonly greetingName = computed(() => {
  const s = this.auth.authState();
  if (!s) return '';
  const local = s.email.split('@')[0];
  return local.length === 0 ? '' : local.charAt(0).toUpperCase() + local.slice(1);
});
```
