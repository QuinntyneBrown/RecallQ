# Sort menu does not dismiss on outside click

**Flow:** 16 — Search Sort
**Severity:** Medium-High (UX trap, a11y)
**Status:** Open

## Symptom

`SortMenuComponent` is a classic menu-button pattern: a chip
(`aria-haspopup="menu"`, `aria-expanded`) opens a `role="menu"` popup
with `Similarity` and `Most recent` options.

Activating an item closes the menu (`this.open.set(false)`), but
clicking anywhere outside the popup leaves it open indefinitely. The
user can scroll the results, click on a result card, or click on the
search query chip — the floating menu stays on top with no way to
dismiss it short of toggling the trigger button or picking an item.

The bottom-nav and sidebar Profile menus already gained outside-click
dismiss earlier in this loop (`bottom-nav-profile-menu-no-outside-
click-dismiss`, `sidebar-profile-menu-no-outside-click-dismiss`).
The sort menu is the same component shape and was missed.

## Expected

When the sort menu is open, a click outside the component's host
element closes it. Same behaviour as the Profile menus.

## Actual

The menu remains open until either an item is clicked or the trigger
chip is tapped again.

## Repro

1. Open `/search?q=anything` so the sort menu trigger is enabled.
2. Tap `Sort · Similarity`.
3. The menu opens.
4. Click anywhere on the page outside the menu (e.g., on the results
   list).
5. Observe: the menu stays open.

## Notes

Radically simple fix: inject `ElementRef` and a `@HostListener('document:click')`
in `SortMenuComponent` that closes the menu when the click target is
not contained by the host element — the same pattern already used by
`BottomNavComponent` and `SidebarComponent`.
