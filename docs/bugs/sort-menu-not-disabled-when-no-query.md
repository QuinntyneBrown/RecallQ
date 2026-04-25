# Sort menu is interactive when no query is set

**Flow:** [16 — Search Sort](../flows/16-search-sort/16-search-sort.md)
**Traces:** L1-004, L2-018.
**Severity:** Low — Flow 16 alternatives say "No query set yet → sort control is disabled". When a visitor opens `/search` without a `?q` parameter the SPA renders a `Query is required` error but the sort chip is still enabled. Tapping it opens the menu and picking a value re-issues an empty-query search, producing the same error — a meaningless action loop.

## Observed

`frontend/src/app/ui/sort-menu/sort-menu.component.ts` defines no `disabled` input. The chip button has no `[disabled]` binding either, so it is always interactive:

```html
<button type="button" class="chip" aria-label="Sort" … (click)="toggle()">
  Sort · {{ label() }}
</button>
```

`search.page.ts` renders the menu unconditionally inside the toolbar (the query chip beside it is correctly gated on `@if (q())`).

## Expected

Per Flow 16: when the search has no query (`!q()`), the sort control should be disabled — the chip cannot be opened and `sortChange` cannot fire.

## Fix sketch

1. Add `@Input() disabled = false;` to `SortMenuComponent`, bind it to the chip via `[disabled]="disabled"`, and short-circuit `toggle()` / `pick()` when disabled.
2. Bind `[disabled]="!q()"` from `search.page.ts`.
