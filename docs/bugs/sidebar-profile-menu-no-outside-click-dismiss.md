# Sidebar profile menu does not dismiss on outside click

**Status:** Complete — `SidebarComponent` now uses `@HostListener('document:click')` to close the menu when the click target is outside the host element, mirroring the bottom-nav fix.
**Flow:** [03 — User Logout](../flows/03-user-logout/03-user-logout.md)
**Traces:** L1-001, L2-003, L2-066.
**Severity:** Low-Medium — Mirror of the bottom-nav bug just fixed: at MD+ viewports the sidebar is shown instead of the bottom nav. Tapping the Profile icon opens the Log out menu, but tapping anywhere else on the screen leaves the menu mounted because `SidebarComponent` has no `document:click` listener.

## Observed

`frontend/src/app/ui/sidebar/sidebar.component.ts`:

```ts
toggleMenu() { this.menuOpen.update(v => !v); }
```

The component has the same Profile / Log out menu pattern as the bottom-nav before its fix, with no host-document click watcher.

## Expected

A click outside the `.profile-wrap` (more broadly, outside the sidebar's host element) should close the menu — same UX guarantee that ships in `BottomNavComponent` after the previous fix.

## Fix sketch

Inject `ElementRef` and add a `@HostListener('document:click')` that closes the menu when the click target is outside the host:

```ts
@HostListener('document:click', ['$event'])
onDocClick(ev: MouseEvent): void {
  if (!this.menuOpen()) return;
  const target = ev.target as Node | null;
  if (target && !this.host.nativeElement.contains(target)) {
    this.menuOpen.set(false);
  }
}
```
