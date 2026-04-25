# Result-card avatar is 48px, design says 44

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The avatar inside a search result-card is 48×48, but the design's resCard avatar is 44×44 — sized to leave more breath for the body text alongside.

In `docs/ui-design.pen` the result-card avatar (`6awDa`) declares `height: 44, width: 44`.

## Observed

`frontend/src/app/ui/result-card/result-card.component.css`:

```css
.avatar {
  flex: 0 0 auto;
  width: 48px; height: 48px;
  ...
}
```

## Expected

```css
.avatar {
  flex: 0 0 auto;
  width: 44px; height: 44px;
  ...
}
```

## Fix sketch

Two-value swap. The featured-result avatar is a separate component and stays at 64×64 per design (`Zqt3I` → 64).
