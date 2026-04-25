# Brand wordmark letter-spacing is -0.18px instead of -0.3px

**Status:** Open
**Flow:** [shell — chrome](../flows/) (the `app-brand` component renders on every login / register / unauth page)
**Severity:** Low — visual / brand fidelity. The "RecallQ" wordmark sits slightly looser than the design specifies, so the brand reads marginally wider than every appearance of the same component in `docs/ui-design.pen`.

In `docs/ui-design.pen` the brand text appears as `BtEcS` / `eRYEq` / `jYVgp` (login, register, home topbar) all with identical typography:

```json
{
  "fontFamily": "Geist",
  "fontSize": 18,
  "fontWeight": "600",
  "letterSpacing": -0.3
}
```

Pencil pen units default to pixels, so `-0.3` here is `-0.3px`. The implementation declares `letter-spacing: -0.01em`, which at 18px resolves to ~`-0.18px` — about half the spec.

## Observed

`frontend/src/app/ui/brand/brand.component.css`:

```css
.brand {
  ...
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
}
```

## Expected

```css
.brand {
  ...
  letter-spacing: -0.3px;
}
```

## Fix sketch

One-token swap. Single source of truth for the brand wordmark, so every page that mounts `<app-brand/>` comes into spec at once.
