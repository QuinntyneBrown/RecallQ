# Contact detail hero avatar ignores server-assigned colors

**Flow:** [05 — Create Contact](../flows/05-create-contact/05-create-contact.md) (rendered through Flow 07)
**Traces:** L1-002, L2-005, L2-035.
**Severity:** Low-Medium — Flow 05 step 4 says the server "defaults `avatarColorA/B` from the palette when not supplied", and `ContactDetailDto` exposes both fields. The hero avatar in `contact-detail.page` always uses the static `linear-gradient(var(--accent-gradient-start), var(--accent-gradient-end))`, so every contact looks identical. The avatar is the strongest visual identifier for a contact in the design — losing per-contact colors flattens the feed.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.css`:

```css
.avatar {
  width: 96px; height: 96px; border-radius: var(--radius-full);
  background: linear-gradient(var(--accent-gradient-start), var(--accent-gradient-end));
  …
}
```

The template renders `<div class="avatar" data-testid="hero-avatar">{{ c.initials }}</div>` — no inline style binding to the contact's color fields.

## Expected

When the contact carries non-null `avatarColorA` and `avatarColorB`, the hero avatar's background should be `linear-gradient(135deg, <colorA>, <colorB>)`. When either is missing, fall back to the existing token gradient.

## Fix sketch

Bind a `[style.background]` attribute on the avatar that picks the palette colors when present:

```html
<div
  class="avatar"
  data-testid="hero-avatar"
  [style.background]="c.avatarColorA && c.avatarColorB
    ? 'linear-gradient(135deg, ' + c.avatarColorA + ', ' + c.avatarColorB + ')'
    : null"
>{{ c.initials }}</div>
```

Inline `null` lets the static `.avatar { background: ... }` rule keep applying as the fallback.
