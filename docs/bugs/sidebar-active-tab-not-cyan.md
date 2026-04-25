# Desktop sidebar has no active-tab tint

**Status:** Open
**Flow:** [shell — chrome](../flows/) (sidebar is the desktop counterpart of the bottom nav)
**Severity:** Low — visual / brand fidelity. The sidebar is the desktop adaptation of the mobile `Bottom Nav` from `docs/ui-design.pen` (`f4T0y`), where the active tab paints in `--accent-tertiary` (`#4BE8FF`). The sidebar implementation styles every nav link with `--foreground-muted` regardless of route — same gap as the recently-fixed bottom-nav (`bottom-nav-active-tab-not-cyan.md`), now expressed at the desktop breakpoint.

The sidebar mounts when `breakpoints.md()` is true (per `app.html`), so users on widescreen viewports never see which tab they're on.

## Observed

`frontend/src/app/ui/sidebar/sidebar.component.html`:

```html
<a routerLink="/home" aria-label="Home"><i class="ph ph-house"></i></a>
<a routerLink="/search" aria-label="Search"><i class="ph ph-magnifying-glass"></i></a>
<a routerLink="/ask" aria-label="Ask"><i class="ph ph-sparkle"></i></a>
```

`frontend/src/app/ui/sidebar/sidebar.component.css` defines `a, button { color: var(--foreground-muted); }` and a hover/focus state, but no active route state.

## Expected

The link whose route matches the current URL paints in `--accent-tertiary` — exactly the same rule the bottom-nav now uses:

```css
a.active { color: var(--accent-tertiary); }
```

## Fix sketch

Add `routerLinkActive="active"` to each nav link, import `RouterLinkActive` in the component class, and add the `.active` rule. Mirrors the bottom-nav fix.
