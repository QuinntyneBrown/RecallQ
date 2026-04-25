# Result-card name inherits Inter, design says Geist 15/600

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The contact name on a result-card declares only `font-weight: 600` — font-family inherits Inter from the body, font-size falls back to the inherited 14px (the page default). The design specifies Geist 15/600 for the name (`bkdN0`).

In `docs/ui-design.pen` the result-card name:

```json
{ "content": "Alex Chen", "fontFamily": "Geist", "fontSize": 15, "fontWeight": "600" }
```

## Observed

`frontend/src/app/ui/result-card/result-card.component.css`:

```css
.name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

## Expected

```css
.name {
  font-family: 'Geist', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
```

## Fix sketch

Two-property addition. Markup unchanged. Mirrors the global heading stack that other Geist surfaces use.
