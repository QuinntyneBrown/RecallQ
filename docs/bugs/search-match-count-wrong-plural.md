# Search match-count uses plural noun when count is 1

**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Traces:** L1-004, L2-014.
**Severity:** Low — `frontend/src/app/pages/search/search.page.html` (post-templateUrl refactor) shows `{{ contactsMatched() }} contacts matched`. When the server returns exactly one match the meta band reads `1 contacts matched`, which is grammatically wrong and inconsistent with the home subtitle fix already shipped.

## Observed

```html
<span data-testid="match-count">{{ contactsMatched() }} contacts matched</span>
```

`contactsMatched` is the raw server count. Flow 18 step 3 explicitly accepts `0 contacts matched` for zero, but says nothing about 1; the natural English form is `1 contact matched` (singular).

## Expected

Pluralise based on the count:

- `0` → `0 contacts matched`
- `1` → `1 contact matched`
- `≥ 2` → `N contacts matched`

## Fix sketch

Add a `matchCountLabel` computed in `search.page.ts` that picks the singular/plural form, and bind it instead of the bare interpolation in the template:

```ts
readonly matchCountLabel = computed(() => {
  const n = this.contactsMatched();
  return n === 1 ? '1 contact matched' : `${n} contacts matched`;
});
```
