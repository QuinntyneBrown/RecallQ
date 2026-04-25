# Ask input aria-label mismatches Flow 41 spec

**Flow:** 41 — Screen Reader Announcement for Streaming Chat
**Severity:** Low-Medium (a11y consistency)
**Status:** Open

## Symptom

Flow 41 step 1:

> User types the question; the input's `aria-label` is `Ask a question`.

The SPA's chat input uses `Ask anything` instead:

```html
<input #inp type="text" aria-label="Ask anything" placeholder="Ask anything"
       [value]="draft()" …>
```

Sighted users see the placeholder "Ask anything" (a friendly free-form
prompt). Screen-reader users hear the same string read as the
accessible name. The flow specifies a more directive label
(`Ask a question`) that better conveys the input's purpose. The
mismatch is small but it's a flow-spec violation; the sr-only label
should be the canonical name regardless of the visible placeholder.

## Expected

`aria-label="Ask a question"`. The visible placeholder can stay as
`Ask anything` or change to match — the flow only constrains the
accessible name.

## Actual

`aria-label="Ask anything"`.

## Repro

1. Open `/ask`.
2. Inspect the chat input: `aria-label="Ask anything"`, not
   `Ask a question`.

## Notes

Radically simple fix: change `aria-label="Ask anything"` to
`aria-label="Ask a question"` in `ask.page.html`. Leave the
placeholder as-is.
