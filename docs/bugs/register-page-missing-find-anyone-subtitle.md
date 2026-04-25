# Register page is missing the "Find anyone by meaning, not memory." subtitle

**Status:** Open
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Severity:** Low — visual / brand fidelity. The register page jumps straight from the `Create account` headline to the email field, but the design pairs the headline with a short reminder of the value prop.

In `docs/ui-design.pen` the register hero frame (`6sIXe`) holds two children with `gap: 8`:

```json
[
  { "id": "5KjFh", "content": "Create account", "fontFamily": "Geist", "fontSize": 32, "fontWeight": "700", "letterSpacing": -0.8 },
  { "id": "2yBOh", "content": "Find anyone by meaning, not memory.", "fontFamily": "Inter", "fontSize": 15, "fontWeight": "normal", "fill": "#B8B8D4", "lineHeight": 1.4 }
]
```

`5KjFh` is the headline (now correctly sized after `register-page-typography-and-gap-mismatch.md`). `2yBOh` is the subtitle and has no representation in the implementation. Mirrors the analogous fix just shipped for the login page (`login-page-missing-welcome-subtitle.md`).

## Observed

`frontend/src/app/pages/register/register.page.html`:

```html
<section class="page">
  <app-brand/>
  <h1>Create account</h1>
  <form (submit)="onSubmit($event)">
    ...
```

No paragraph between the `h1` and the `form`.

## Expected

A `<p class="hero-sub">Find anyone by meaning, not memory.</p>` element directly after the headline, paired into a `.hero` column with `gap: 8` so it sits 8px below the headline while preserving the outer `.page { gap: 32 }` rhythm — exactly the same shape the login fix uses.

## Fix sketch

Mirror the login solution: wrap the headline + subtitle in a `<div class="hero">…</div>`, add `.hero { display: flex; flex-direction: column; gap: 8px; }` and `.hero-sub { color: var(--foreground-secondary); font-size: 15px; line-height: 1.4; margin: 0; }`.
