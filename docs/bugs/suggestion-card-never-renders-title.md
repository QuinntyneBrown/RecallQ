# Suggestion-card never renders the title heading

**Flow:** 25 — Proactive AI Suggestion (Render and Dismiss)
**Severity:** High (lost UX content)
**Status:** Complete — `suggestion-card.component.html` now renders `<h3 class="title">{{ suggestion.title }}</h3>` between the eyebrow row and the body paragraph; `suggestion-card.component.css` adds `.title` styling (size 18, weight 600, on-accent color) so the AI's one-phrase summary is visible above the longer body.

## Symptom

`SuggestionDetector` emits each suggestion with a distinct **title** and
**body**:

| kind          | Title                          | Body                                                              |
| ------------- | ------------------------------ | ----------------------------------------------------------------- |
| meet_n_tag    | "You met 3 AI founder"         | "You met 3 AI founder last week — shall I find similar investors?" |
| owed_replies  | "5 possible unreplied emails"  | "You have 5 possible unreplied emails — want to triage them?"     |
| silent_warm   | "Gone quiet"                   | "You've gone quiet with John Smith — worth a check-in?"           |

The API returns both fields:

```csharp
return Results.Ok<object?>(new {
    id = row.Id, key = row.Key, kind = row.Kind,
    title = row.Title, body = row.Body,
    actionLabel = row.ActionLabel, actionHref = row.ActionHref,
});
```

The SPA's `Suggestion` interface includes `title`, but
`suggestion-card.component.html` never renders it:

```html
<article class="sug" data-testid="suggestion-card">
  <div class="row">
    <span class="dot" aria-hidden="true"></span>
    <p class="eyebrow">AI SUGGESTION</p>
  </div>
  <p class="body">{{ suggestion.body }}</p>
  ...
</article>
```

So the user sees the eyebrow + the long body sentence + the actions,
but the scannable headline (e.g., "Gone quiet") that summarizes the
suggestion is silently dropped. The flow's API contract calls this
field `heading` for that reason — it's the salient label.

## Expected

The card renders the title as a heading (e.g., `<h3>`) above the body
sentence, so users — sighted, screen-reader, and skim-reading alike —
see the AI's one-phrase summary first.

## Actual

Title is fetched, parsed, stored on the signal, and never displayed.

## Repro

1. Mock `/api/suggestions` to return
   `{ id: '…', key: 'silent-warm-x', kind: 'silent_warm', title: 'Gone quiet', body: "You've gone quiet with X — worth a check-in?", actionLabel: 'Open contact', actionHref: '/contacts/x' }`.
2. Open `/home`.
3. The suggestion card shows the eyebrow + body, but "Gone quiet" is
   nowhere on screen.

## Notes

Radically simple fix: add an `<h3 class="title">{{ suggestion.title }}</h3>`
between the eyebrow row and the body paragraph, with appropriate styling
(white-on-gradient, weight 600).
