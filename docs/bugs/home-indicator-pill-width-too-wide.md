# Home indicator pill is 140px wide instead of 134px

**Status:** Open
**Flow:** [shell — chrome](../flows/) (home indicator is part of the global mobile shell)
**Severity:** Low — visual / brand fidelity. The mobile home-indicator pill ships 6px wider than the iOS-style guideline the design captures.

In `docs/ui-design.pen` the reusable `Home Indicator` component (`JRdjy` → `nNWch`):

```json
{ "type": "rectangle", "width": 134, "height": 5, "cornerRadius": 3, "fill": "#FFFFFF" }
```

134px is the iOS home-indicator width. The implementation hard-codes 140.

## Observed

`frontend/src/app/ui/home-indicator/home-indicator.component.css`:

```css
.pill {
  width: 140px;
  height: 5px;
  border-radius: var(--radius-full);
  background: var(--foreground-primary);
  display: block;
}
```

## Expected

```css
.pill {
  width: 134px;
  ...
}
```

## Fix sketch

Single-line CSS change. No HTML change.
