# Bottom nav has no active-tab tint

**Status:** Open
**Flow:** [shell — chrome](../flows/) (bottom nav is part of the global mobile shell)
**Severity:** Low — visual / brand fidelity. Tapping a tab in the bottom nav and landing on its route does not change the tab's appearance, so the user has no visual confirmation of where they are.

In `docs/ui-design.pen` the reusable `Bottom Nav` component (`f4T0y`) renders four tabs. The active tab paints both its icon and its label in the cyan accent (`#4BE8FF` — `--accent-tertiary`); the inactive tabs paint in `#6E6E8F` (project token `--foreground-muted` after the WCAG bump). The home frame shows tab1 (Search) in the active state.

The implementation styles every nav link with `--foreground-muted` regardless of route. There is no `routerLinkActive` directive on the links and no `.active` rule in the component CSS, so the active link is indistinguishable from the inactive ones.

## Observed

`frontend/src/app/ui/bottom-nav/bottom-nav.component.html`:

```html
<a routerLink="/home" aria-label="Home"><i class="ph ph-house"></i></a>
<a routerLink="/search" aria-label="Search"><i class="ph ph-magnifying-glass"></i></a>
<a routerLink="/ask" aria-label="Ask"><i class="ph ph-sparkle"></i></a>
```

`frontend/src/app/ui/bottom-nav/bottom-nav.component.css` defines `a, button { color: var(--foreground-muted); }` and a `:hover/:focus` state, but no active route state.

## Expected

The link whose route matches the current URL paints in `--accent-tertiary` (`#4BE8FF`). Inactive links keep `--foreground-muted`.

## Fix sketch

Add `routerLinkActive="active"` to each nav link and a `.active { color: var(--accent-tertiary); }` rule. Use `[routerLinkActiveOptions]="{ exact: true }"` if `/home` and other nested routes need finer matching; for the current top-level routes (`/home`, `/search`, `/ask`) the default prefix match is sufficient.
