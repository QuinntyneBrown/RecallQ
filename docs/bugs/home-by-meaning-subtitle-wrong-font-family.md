# Home `By meaning, not memory.` uses Inter, not Geist

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The hero gradient sub line ships in Inter (the body default) instead of Geist. Geist is the typeface the design pairs with the headline above it, so the two lines are intended to read as a single typographic block.

In `docs/ui-design.pen` node `KhJIT` (the second hero line of `1. Vector Search Home`):

```json
{
  "fontFamily": "Geist",
  "fontSize": 34,
  "fontWeight": "700",
  "letterSpacing": -1.2,
  "lineHeight": 1.05
}
```

`Find anyone.` (`F2ZYi`) one row above also uses Geist. The headline picks Geist via the global `h1, h2, h3, h4, h5, h6 { font-family: "Geist", … }` rule in `styles.css`. The sub line is rendered as `<p class="hero-sub">`, which falls back to the body's Inter stack since `.hero-sub` does not declare a font.

## Observed

`frontend/src/app/pages/home/home.page.html`:

```html
<h1 id="hero-title" class="hero-title">Find anyone.</h1>
<p class="hero-sub">By meaning, not memory.</p>
```

`frontend/src/app/pages/home/home.page.css` — `.hero-sub` lists no `font-family`, so the paragraph inherits the body Inter stack from `frontend/src/styles.css`.

## Expected

`.hero-sub` paints in Geist, matching the line above and the design node `KhJIT.fontFamily`.

## Fix sketch

Add `font-family: "Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;` to `.hero-sub` (mirror the global heading stack so the fallback chain stays consistent). No HTML change required.
