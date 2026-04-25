# Ask user bubble gradient ends in pink, design ends in magenta

**Status:** Open
**Flow:** [04 — AI Ask Mode](../flows/04-ai-ask/04-ai-ask.md)
**Severity:** Low — visual / brand fidelity. The user-question bubble paints a purple-to-pink gradient (`--accent-gradient-start` `#7C3AFF` → `--accent-gradient-end` `#FF5EE7`), but the design's `MeWfk` uqBubble declares a tighter purple-to-magenta sweep (`#7C3AFF` → `#BF40FF`). The current too-warm finish reads as a CTA flair, while the spec's twin-purple gradient keeps the bubble feeling like a single-tone speech surface.

In `docs/ui-design.pen`:

```json
{
  "id": "MeWfk",
  "name": "uqBubble",
  "fill": {
    "type": "gradient",
    "gradientType": "linear",
    "rotation": 135,
    "colors": [
      { "color": "#7C3AFF", "position": 0 },
      { "color": "#BF40FF", "position": 1 }
    ]
  }
}
```

`#BF40FF` is `--accent-gradient-mid` in the existing token palette.

## Observed

`frontend/src/app/pages/ask/ask.page.css`:

```css
.user-bubble {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-end));
  color: var(--foreground-primary);
}
```

## Expected

```css
.user-bubble {
  align-self: flex-end;
  background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-mid));
  color: var(--foreground-primary);
}
```

## Fix sketch

Single-token swap on the second gradient stop: `--accent-gradient-end` → `--accent-gradient-mid`.
