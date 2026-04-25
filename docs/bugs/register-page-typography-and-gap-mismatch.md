# Register page section gap is 16 and heading is 28, both off-spec

**Status:** Open
**Flow:** [02 — Authentication](../flows/02-authentication/02-authentication.md)
**Severity:** Low — visual / brand fidelity. The register page mirrors the login page in the design (`docs/ui-design.pen` frames `cjfLK` register and `14Keh` login share an identical content column shape `8qbab` / `J7c8f`). Login was just brought into spec; register lags behind on the same two values.

In `docs/ui-design.pen`:

- `8qbab` (register content column) → `gap: 32`
- `5KjFh` ("Create account" headline) → Geist 32/700, `letterSpacing: -0.8`

The implementation ships:

- `.page { gap: 16px }`
- `h1 { font-size: 28px }`, no `letter-spacing`

## Observed

`frontend/src/app/pages/register/register.page.css`:

```css
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  ...
}
h1 {
  color: var(--foreground-primary);
  font-size: 28px;
  margin: 0;
}
```

## Expected

```css
.page {
  ...
  gap: 32px;
  ...
}
h1 {
  color: var(--foreground-primary);
  font-size: 32px;
  letter-spacing: -0.8px;
  margin: 0;
}
```

## Fix sketch

Three CSS values total: `.page` gap → 32, `h1` font-size → 32, add `h1` letter-spacing -0.8px. Mirrors the analogous fixes already shipped for the login page.
