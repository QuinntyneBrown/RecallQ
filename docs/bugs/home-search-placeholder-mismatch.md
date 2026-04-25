# Home search input placeholder does not match `ui-design.pen`

**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Traces:** L1-004, L2-014.
**Severity:** Low — `frontend/src/app/pages/home/home.page.ts` renders the home search input with `placeholder="Search contacts"`, but the design system Search Bar (`lpCnN` → `l9VNc` in `docs/ui-design.pen`) uses the more on-brand `Search by meaning...` placeholder. The product is positioned around semantic / meaning-first lookup, so the design copy carries the value prop the implementation flattens.

## Observed

```html
<input id="q" class="search-input" type="search" role="searchbox"
       aria-label="Search contacts"
       placeholder="Search contacts"
       (keyup.enter)="goSearch($event)" />
```

## Expected

`placeholder="Search by meaning..."`. The accessible label `aria-label="Search contacts"` is fine — it describes the action; the placeholder is the on-brand hint visible to sighted visitors.

## Fix sketch

Change the literal placeholder string. The aria-label and surrounding markup stay the same.
