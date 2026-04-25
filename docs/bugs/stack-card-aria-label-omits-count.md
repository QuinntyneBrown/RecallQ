# Stack-card aria-label omits the count

**Flow:** 24 — Smart Stacks (View and Open)
**Severity:** Medium-High (a11y)
**Status:** Open

## Symptom

`stack-card.component.html` sets:

```html
<a … [attr.aria-label]="stack.name">
  <div class="count">{{ displayCount() }}</div>
  <div class="name">{{ stack.name }}</div>
</a>
```

Because `aria-label` is set on the anchor, assistive tech ignores the
descendant text and announces just the name. A screen-reader user
focusing the card hears "AI founders, link" with no count, even though
the visible UI prominently displays the number (the largest piece of
text in the card).

The flow's own example phrasing is:

> count + label (e.g., `27 AI founders`, `14 Intros owed`, `9 Close friends`)

so the count is treated as part of the salient label.

## Expected

The accessible name should include both the count and the stack name —
e.g. `aria-label="27 AI founders"` — so SR users hear what sighted
users see.

## Actual

`aria-label="AI founders"`. Count is not announced.

## Repro

1. Mock `/api/stacks` to return `[{ id: '…', name: 'AI founders', kind: 'Tag', count: 27 }]`.
2. Open `/home`.
3. Inspect the rendered stack card; `aria-label` is `AI founders`, not `27 AI founders`.

## Notes

Radically simple fix:

- Bind `aria-label` to a computed string `displayCount() + ' ' + stack.name`,
  e.g. `27 AI founders` (or `999+ AI founders` for the saturated count).
