# Timeline-item title silently truncates content at 60 chars with no ellipsis

**Flow:** 11 — Log Interaction (timeline rendering on contact detail and All Activity)
**Severity:** Medium (every long-content interaction renders a truncated mid-word title with no indicator that more text exists; users have no way to tell whether what they see is the whole note or a cut-off slice)
**Status:** Complete — `TimelineItemComponent.titleText()` now walks back to the nearest space before the 60-char cut and appends U+2026 when truncation actually happens. Subjects (used as-is) and short content (≤60 chars) are unchanged. New e2e test `bug-timeline-item-title-ellipsis.spec.ts` mocks a long-content note and asserts the rendered title ends with the ellipsis character.

## Symptom

`frontend/src/app/ui/timeline-item/timeline-item.component.ts`:

```typescript
titleText() {
  if (this.item.subject && this.item.subject.trim().length) return this.item.subject;
  return (this.item.content || '').slice(0, 60);
}
```

When an interaction has no `subject` and `content` exceeds 60 characters, the helper takes a raw `slice(0, 60)` and returns it as the title — **no ellipsis, no whitespace-aware boundary**. A 200-char note like:

> `"Today I met Avery and we discussed the new product roadmap for Q2 — really productive."`

renders in the timeline as:

> `Today I met Avery and we discussed the new product roadmap`

The user sees a chopped phrase with no visual cue that more text exists. The truncation can fall mid-word, mid-sentence, or right before a comma. Sighted users may assume that's the whole note; SR users hear the same misleading partial sentence.

The pattern in the codebase elsewhere (`IntroDraftGenerator.Truncate`) already does whitespace-aware truncation **plus** appends `…`. The timeline title should follow the same convention.

## Expected

When the title comes from `content` and would exceed 60 visible characters, render the first ~60 chars (preferably ending on a word boundary) followed by an ellipsis (`…`):

```
Today I met Avery and we discussed the new product…
```

When the title fits within 60 chars, no ellipsis is appended. When `subject` is present and non-empty, it's used as-is (subjects are short by convention; truncation logic doesn't apply).

## Actual

```
Today I met Avery and we discussed the new product roadmap
```

— mid-word cut, no ellipsis.

## Repro

1. Log in.
2. Open any contact's detail page.
3. Tap **Log** → pick **Note** → leave Subject empty → in Content type 100+ chars (e.g., paste two sentences).
4. Save.
5. Observe the new timeline row's title: the content is hard-cut at 60 chars with no ellipsis or trailing indicator.

## Notes

Radically simple fix — append `…` when truncation actually happened, and prefer to land on a word boundary (mirroring `IntroDraftGenerator.Truncate`):

```typescript
titleText() {
  if (this.item.subject && this.item.subject.trim().length) return this.item.subject;
  const content = this.item.content ?? '';
  if (content.length <= 60) return content;
  const cut = content.slice(0, 60);
  const sp = cut.lastIndexOf(' ');
  const head = sp > 30 ? cut.slice(0, sp) : cut;
  return head + '…';
}
```

No template, CSS, or backend changes required. The 60-char budget stays the same; the change is purely the truncation logic. CSS-based `text-overflow: ellipsis` is **not** sufficient on its own here because the helper return value is what's read by SR users and used downstream (e.g., for `aria-label` of timeline rows in any future iteration) — the JS-level string needs the indicator.
