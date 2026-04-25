# Home greeting and `Find anyone.` headline collapse together

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The greeting eyebrow ("Good morning, …") sits flush against the `Find anyone.` headline, so the eyebrow reads as part of the headline rather than as a separate beat.

In `docs/ui-design.pen` the hero column (`MXtnM`) has `layout: vertical`, `gap: 14`. Its three children are the greeting (`U0SNr`), the heroTitleRow (`TizXT`), and the description (`iLRLS`). That `gap: 14` sets a clean 14px breath between the greeting and the headline.

The implementation has no gap and no top margin on the headline:

- `.greeting` → `margin: 0`
- `.hero-title` → `margin: 0`

So the two paragraphs touch at their line-box edges with no breathing room.

## Observed

`frontend/src/app/pages/home/home.page.css`:

```css
.greeting {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--foreground-muted);
}
.hero-title {
  margin: 0;
  font-size: 34px;
  ...
}
```

## Expected

A 14px gap between the greeting and the headline, matching the design hero column's `gap: 14`. The simplest expression is `margin-top: 14px` on `.hero-title` (preserves the existing `margin: 0` reset on `.greeting`).

## Fix sketch

```css
.hero-title {
  margin: 14px 0 0;
  ...
}
```

No HTML change. Headline + sub line stay flush (their `gap: 2` design intent is fine for now and is much smaller than would be visible with default line-box spacing).
