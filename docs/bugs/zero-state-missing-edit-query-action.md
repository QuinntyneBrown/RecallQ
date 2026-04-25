# Search zero-state missing "Edit query" ghost action

**Flow:** [18 — Search Zero-Result State](../flows/18-search-zero-state/18-search-zero-state.md)
**Traces:** L1-004, L2-014.
**Severity:** Low-Medium — Flow 18 step 3 lists "two actions: `Ask RecallQ` (primary) and `Edit query` (ghost)". `ZeroStateComponent` ships only the primary `Ask RecallQ` link; the ghost `Edit query` action is absent, so the visitor's only way to retry with a different wording is to navigate back to home manually.

## Observed

`frontend/src/app/ui/zero-state/zero-state.component.html`:

```html
<div class="zero" data-testid="zero-state">
  <i class="ph ph-magnifying-glass icon" aria-hidden="true"></i>
  <h2 class="head">No matches yet</h2>
  <p class="body">Your query didn't match any indexed contacts or interactions.</p>
  <a [routerLink]="['/ask']" [queryParams]="q ? { q } : null" class="link">Ask RecallQ</a>
</div>
```

## Expected

A ghost-styled `Edit query` button alongside the primary link. The simplest semantics: it sends the visitor back so they can change the query — the home search bar already accepts new queries and is the standard entry point.

## Fix sketch

1. Add a `(picked)` output (or a `Router` injection) to `ZeroStateComponent` that navigates to `/home`.
2. Render a second action in the template:
   ```html
   <button type="button" class="ghost" (click)="editQuery()">Edit query</button>
   ```
3. `editQuery()` calls `this.router.navigateByUrl('/home')`. Style the `.ghost` button as a transparent text button so it sits next to the primary link without competing.
