# Citation card renders raw similarity instead of the Score chip

**Flow:** [20 — Ask Citations](../flows/20-ask-citations/20-ask-citations.md)
**Traces:** L1-005, L2-023.
**Severity:** Medium — Flow 20 step 4 says "Each card uses the `Score High` / `Mid` / `Low` component for its similarity tier." The implementation prints the raw `0.91` style number in a plain muted span, so visitors do not get the tiered chip the design system already exposes (`0QZrm` / `lzlpQ` / `fiEpD` in `docs/ui-design.pen`, mirrored by `ScoreChipComponent` in code).

## Observed

`frontend/src/app/ui/citation-card/citation-card.component.ts`:

```html
<div class="row">
  <strong>{{ citation.contactName }}</strong>
  <span class="score">{{ citation.similarity.toFixed(2) }}</span>
</div>
```

A separate `app-score-chip` component already encapsulates the tiered visual (with `computeTier` mapping similarity to `high`/`mid`/`low`) and is used elsewhere on the search results, but the Ask citation card never imports it.

## Expected

Citation cards should render `<app-score-chip [value]="citation.similarity"/>` instead of the bare `<span>`. The existing `ScoreChipComponent` handles the tier mapping, the styling, and the rounded label — so the only change is at the call site.

## Fix sketch

1. Import `ScoreChipComponent` into the citation card's `imports` array.
2. Replace the score `<span>` with `<app-score-chip [value]="citation.similarity"/>`.
