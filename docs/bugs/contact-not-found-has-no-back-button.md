# Contact-not-found state has no back button

**Flow:** [07 — View Contact Detail](../flows/07-view-contact-detail/07-view-contact-detail.md)
**Traces:** L1-009.
**Severity:** Low — Flow 07 alternatives say "Foreign or missing id → `404`, SPA shows 'Contact not found'." The implementation does show that copy, but it lives outside the `@if (contact(); as c)` branch where the topbar (and its Back button) is rendered. A visitor who arrives via a stale link or a deleted contact's URL is dropped onto the message with no in-app way back — only the browser's hardware/menu back button works.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.html`:

```html
@if (contact(); as c) {
  <header class="hero">
    <div class="topbar">
      <button … aria-label="Back" (click)="back()">…</button>
      …
    </div>
    …
  </header>
  …
} @else if (notFound()) {
  <p class="err">Contact not found.</p>
}
```

## Expected

The 404 branch should expose the same Back affordance the loaded state has so the visitor can navigate back to the previous list / search / Ask conversation without leaving the SPA.

## Fix sketch

Add a small topbar around the not-found message that includes the same Back button:

```html
} @else if (notFound()) {
  <header class="hero">
    <div class="topbar">
      <button type="button" class="icon-btn" aria-label="Back" (click)="back()">
        <i class="ph ph-caret-left"></i>
      </button>
    </div>
  </header>
  <p class="err">Contact not found.</p>
}
```
