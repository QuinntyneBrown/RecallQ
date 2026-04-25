# Home `Find anyone.` and `By meaning, not memory.` collapse together

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The two hero lines bleed into each other instead of holding a small ~2px breath between them.

In `docs/ui-design.pen` the `heroTitleRow` frame (`TizXT`) is the inner column that holds `Find anyone.` (`F2ZYi`) and `By meaning, not memory.` (`KhJIT`):

```json
{ "id": "TizXT", "name": "heroTitleRow", "layout": "vertical", "gap": 2 }
```

The 2px nested gap is intentional — the outer hero column (`MXtnM`) uses `gap: 14`, but the two title lines specifically belong together as a single statement, so they get their own tight spacing.

Implementation: `.hero-title` carries `margin: 14px 0 0` (the recently-restored greeting → title gap), and `.hero-sub` carries `margin: 0`. The combined gap between the two lines is `0`, so they share line-box edges with no breath.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.hero-title {
  margin: 14px 0 0;
  ...
}
.hero-sub {
  margin: 0;
  ...
}
```

## Expected

```css
.hero-sub {
  margin: 2px 0 0;
  ...
}
```

This preserves the existing 14px above the headline (greeting → title) and the 14px below the gradient line (sub → description), and inserts the design's 2px nested gap between the two title lines.

## Fix sketch

Single CSS line: change `.hero-sub` margin top from `0` to `2px`. No HTML change.
