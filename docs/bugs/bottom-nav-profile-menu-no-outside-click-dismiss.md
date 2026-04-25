# Bottom-nav profile menu does not dismiss on outside click

**Flow:** [03 — User Logout](../flows/03-user-logout/03-user-logout.md)
**Traces:** L1-001, L2-003, L2-066.
**Severity:** Low-Medium — Once the visitor taps the Profile icon in the bottom nav and opens the Log out menu, tapping anywhere else on the screen (other than Profile or Log out) leaves the menu mounted. Standard menu UX expects an outside click or Escape to dismiss the popover.

## Observed

`frontend/src/app/ui/bottom-nav/bottom-nav.component.ts`:

```ts
toggleMenu() { this.menuOpen.update(v => !v); }
```

There is no `document:click` listener and no Escape handler. The menu only closes when `toggleMenu` is called again (tapping Profile) or when `logout()` runs (which sets `menuOpen.set(false)`).

## Expected

A click outside the `.profile-wrap` container should close the menu, matching the behaviour every WAI-ARIA menu pattern prescribes.

## Fix sketch

1. Inject `ElementRef` into `BottomNavComponent`.
2. Add a `@HostListener('document:click', ['$event'])` that closes the menu when the click target is not inside the host element.
3. Keep `toggleMenu` as the toggle for the Profile button.

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

Same pattern can be applied to the Sidebar component as a follow-up.
