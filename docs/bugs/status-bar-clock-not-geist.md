# Status bar clock falls back to Inter, not Geist

**Status:** Open
**Flow:** [shell — chrome](../flows/) (status bar is part of the global shell)
**Severity:** Low — visual / brand fidelity. The header clock at the top of every page renders in the body's Inter stack, but the design specifies Geist for the time element.

In `docs/ui-design.pen` the reusable `Status Bar` component (`kauhQ` → `VT2mS` "9:41"):

```json
{
  "fontFamily": "Geist",
  "fontSize": 17,
  "fontWeight": "600",
  "fill": "#FFFFFF"
}
```

The font-size and font-weight already match the implementation. The font-family does not — `frontend/src/app/ui/status-bar/status-bar.component.css` declares no `font-family` on `.clock`, so it inherits Inter from the body's global stack in `frontend/src/styles.css`.

Geist is the same display face the home headline and Smart Stacks heading already use, so the clock should match them.

## Observed

`frontend/src/app/ui/status-bar/status-bar.component.css`:

```css
.clock {
  font-weight: 600;
  font-size: 17px;
}
```

## Expected

```css
.clock {
  font-family: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 600;
  font-size: 17px;
}
```

## Fix sketch

Add the design's Geist-led stack to `.clock`. No HTML or component change. Mirrors the global heading stack so the fallback chain stays consistent.
