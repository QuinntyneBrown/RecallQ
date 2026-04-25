# Home indicator paints a solid surface instead of letting the page show through

**Status:** Open
**Flow:** [shell — chrome](../flows/) (home indicator is part of the global mobile shell)
**Severity:** Low — visual / brand fidelity. The home-indicator strip below the bottom nav paints `--surface-primary`, leaving a discrete dark band rather than blending into whatever the page paints behind it (the bottom nav is now translucent, and the page's ambient background reads through there too).

In `docs/ui-design.pen` the reusable `Home Indicator` component (`JRdjy`):

```json
{ "fill": "#00000000" }
```

`#00000000` is transparent — the design intent is that only the white pill renders, not the strip around it. The implementation hard-codes `--surface-primary`.

## Observed

`frontend/src/app/ui/home-indicator/home-indicator.component.css`:

```css
.home-indicator {
  height: 34px;
  ...
  background: var(--surface-primary);
}
```

## Expected

```css
.home-indicator {
  height: 34px;
  ...
  background: transparent;
}
```

## Fix sketch

One-line CSS change. No HTML or component change. Mirrors the analogous fix already shipped for the status bar (`status-bar-background-not-transparent.md`).
