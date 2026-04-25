# Auth aux link ("Log in" / "Create one") renders at 400 weight, not 600

**Status:** Open
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md), [02 — Authentication](../flows/02-authentication/02-authentication.md)
**Severity:** Low — visual / brand fidelity. The cross-link at the bottom of `/login` and `/register` ("Already have an account? Log in" / "Don't have an account? Create one") sits at the body's 400 weight, but the design specifies 600 — a heavier cut that gives the cta link the same visual weight as the cyan accent.

In `docs/ui-design.pen` the register aux frame `pb52d` declares the link `ctoig`:

```json
{
  "content": "Log in",
  "fontFamily": "Inter",
  "fontSize": 14,
  "fontWeight": "600",
  "fill": "#4BE8FF"
}
```

The prompt next to it (`EN9Sa` "Already have an account?") is `fontWeight: "normal"`. Login's aux mirrors the same shape with "Don't have an account? Create one".

Implementation matches the size and color but inherits font-weight from the surrounding paragraph, which inherits 400 from the body.

## Observed

`frontend/src/app/pages/login/login.page.css`:

```css
.aux a {
  color: var(--accent-tertiary);
  text-decoration: none;
}
```

`frontend/src/app/pages/register/register.page.css` defines the same `.aux a` rule with the same omission.

## Expected

```css
.aux a {
  color: var(--accent-tertiary);
  text-decoration: none;
  font-weight: 600;
}
```

## Fix sketch

One-line CSS addition in both `login.page.css` and `register.page.css`. No HTML change. The prompt before the link stays at the inherited 400 weight, so the design's emphasis contrast lands.
