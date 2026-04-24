# T027 — Responsive Shell: LG + XL Multi-pane

| | |
|---|---|
| **Slice** | [21 Responsive shell](../detailed-designs/21-responsive-shell/README.md) |
| **L2 traces** | L2-044, L2-045, L2-046 |
| **Prerequisites** | T026, T014 |
| **Produces UI** | Yes |

## Objective

Introduce two-pane (list + detail) at LG and three-pane (sidebar + list + detail) at XL. State preserves across viewport changes.

## Scope

**In:**
- Search results page adapts to two-pane at LG; selecting a result updates the right pane without navigating away.
- Three-pane template at XL; right pane shows a placeholder when no contact is selected.
- State preservation verified across resize.

**Out:**
- Persistent sidebar-state (collapsed/expanded) toggle.

## ATDD workflow

1. **Red — e2e**:
   - `T027-lg-xl.spec.ts`:
     - At 1200px, issue a search; assert results list pane + empty detail placeholder; click a result; assert right pane fills.
     - At 1440px, assert three panes visible.
     - Resize from XS (375) to LG (1200) while a search is active; assert query string preserved in the input and results still visible.

2. **Green** — implement template + pane routing.

## Playwright POM

Extend `SearchResultsPage`:
```ts
listPane()       { return this.page.getByTestId('results-list-pane'); }
detailPane()     { return this.page.getByTestId('results-detail-pane'); }
detailPlaceholder() { return this.detailPane().getByTestId('select-placeholder'); }
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Pane visibility is controlled by CSS grid-template only; no JS show/hide of structural elements.
- [ ] `SearchResultsPage` signals survive resize (state is kept in a route-scoped injectable signal service, not component fields).

## Screenshot

`docs/tasks/screenshots/T027-lg.png` — LG viewport (1200×800) showing two panes.
`docs/tasks/screenshots/T027-xl.png` — XL viewport (1440×900) showing three panes.

## Definition of Done

- [x] 1 e2e spec passes with all three scenarios.
- [x] Three verification passes complete clean.

**Status: Complete**
