# Bottom nav tabs do not navigate

**Status:** Complete — Home/Search/Ask tabs in `bottom-nav.component.ts` are now `<a routerLink="…">` anchors, matching the Sidebar.
**Flow:** [03 — User Logout](../flows/03-user-logout/03-user-logout.md) (exercising the shell chrome the logout menu lives in)
**Traces:** L1-001, L2-003, L2-081.
**Severity:** High — the entire mobile navigation surface is dead; users cannot reach `/home`, `/search`, or `/ask` via the bottom nav.

## Observed

In `frontend/src/app/ui/bottom-nav/bottom-nav.component.ts`, the Home, Search, and Ask tabs are bare `<button>`s with no click handler, no `routerLink`, no navigation intent at all:

```html
<button type="button" aria-label="Home"><i class="ph ph-house"></i></button>
<button type="button" aria-label="Search"><i class="ph ph-magnifying-glass"></i></button>
<button type="button" aria-label="Ask"><i class="ph ph-sparkle"></i></button>
```

Tapping any of them does nothing. The only functional control below MD is the Profile button (which toggles the logout menu). From `/home`, a mobile user cannot reach `/search` or `/ask` without typing the URL or using the search affordance on the Home hero.

## Expected

The bottom nav must navigate to the matching screen, matching the Sidebar component's existing behaviour — `frontend/src/app/ui/sidebar/sidebar.component.ts` already uses `routerLink` on each tab:

```html
<a routerLink="/home" aria-label="Home">…</a>
<a routerLink="/search" aria-label="Search">…</a>
<a routerLink="/ask" aria-label="Ask">…</a>
```

Additionally, ui-design.pen's Bottom Nav component (`f4T0y`) shows four selectable tabs, so each is interactive by design.

## Fix sketch

Switch the three tab `<button>`s to `<a routerLink="...">` anchors, mirroring the sidebar. Import `RouterLink` into the component. Keep the Profile button as a `<button>` since it toggles the menu rather than navigates.
