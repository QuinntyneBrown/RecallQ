# Login page is missing the "Welcome back." subtitle

**Status:** Open
**Flow:** [02 — Authentication](../flows/02-authentication/02-authentication.md)
**Severity:** Low — visual / brand fidelity. The login page jumps straight from the `Sign in` headline to the email field, but the design pairs the headline with a short "Welcome back." sub line that softens the form's intent.

In `docs/ui-design.pen` the login hero frame (`qoVhd`) holds two children with `gap: 8`:

```json
[
  { "id": "G5WFb", "content": "Sign in", "fontFamily": "Geist", "fontSize": 32, "fontWeight": "700" },
  { "id": "6fJZx", "content": "Welcome back.", "fontFamily": "Inter", "fontSize": 15, "fontWeight": "normal", "fill": "#B8B8D4", "lineHeight": 1.4 }
]
```

`G5WFb` is the headline (now correctly sized after `login-heading-font-size-mismatch.md`). `6fJZx` is the subtitle and has no representation in the implementation. The register page has the analogous gap (its subtitle "Find anyone by meaning, not memory." is also missing — that's tracked in a separate bug).

## Observed

`frontend/src/app/pages/login/login.page.html`:

```html
<section class="page">
  <app-brand/>
  <h1>Sign in</h1>
  <form (submit)="onSubmit($event)">
    ...
```

No paragraph between the `h1` and the `form`.

## Expected

A `<p class="hero-sub">Welcome back.</p>` element directly after the headline:

- Font: Inter 15 / normal (inherits via the body stack).
- Color: `var(--foreground-secondary)` (`#B8B8D4`).
- Line-height: 1.4.
- 8px gap from the headline above (matches the design hero frame's `gap: 8`).

## Fix sketch

Insert the paragraph in the template and add a short `.hero-sub` rule in `login.page.css`. The `.page { gap: 32 }` rule will introduce a 32px gap between the new `.hero-sub` and the form below it — that matches the design column rhythm. To keep the headline-to-subtitle gap tight (8px), wrap the headline + subtitle in a flex column or set `.hero-sub { margin-top: -24px; }` (since 32 - (-24) = 8). The cleanest expression is the wrapping div:

```html
<div class="hero">
  <h1>Sign in</h1>
  <p class="hero-sub">Welcome back.</p>
</div>
```

```css
.hero { display: flex; flex-direction: column; gap: 8px; }
.hero-sub { margin: 0; color: var(--foreground-secondary); font-size: 15px; line-height: 1.4; }
```
