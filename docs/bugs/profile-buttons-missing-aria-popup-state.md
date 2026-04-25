# Bottom-nav and sidebar Profile buttons miss aria-haspopup/expanded

**Flow:** [03 — User Logout](../flows/03-user-logout/03-user-logout.md)
**Traces:** L1-001, L1-015, L2-066.
**Severity:** Low — Both `BottomNavComponent` and `SidebarComponent` render a Profile `<button>` that toggles a `role="menu"` popup, but the button itself only carries `aria-label="Profile"`. WAI-ARIA's menu-button pattern expects `aria-haspopup="menu"` and `aria-expanded="true|false"` so screen-reader users hear "Profile, menu, collapsed" before they activate the trigger and "expanded" once the menu opens.

## Observed

`frontend/src/app/ui/bottom-nav/bottom-nav.component.html`:

```html
<button type="button" aria-label="Profile" (click)="toggleMenu()">
  <i class="ph ph-user"></i>
</button>
```

`frontend/src/app/ui/sidebar/sidebar.component.html` is the same shape.

## Expected

Add `aria-haspopup="menu"` and bind `[attr.aria-expanded]` to the `menuOpen` signal on both Profile buttons:

```html
<button
  type="button"
  aria-label="Profile"
  aria-haspopup="menu"
  [attr.aria-expanded]="menuOpen()"
  (click)="toggleMenu()"
>
  <i class="ph ph-user"></i>
</button>
```

## Fix sketch

Apply the same two-attribute change to both `bottom-nav.component.html` and `sidebar.component.html`. No component-class change required — `menuOpen` is already exposed on each.
