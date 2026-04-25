# Citation mini-card has no avatar

**Flow:** 20 — Ask Citations (Mini-Cards)
**Severity:** Medium
**Status:** Open

## Symptom

Flow 20 step 3:

> The SPA parses the event and appends `ContactMiniCard` components
> inside the last assistant bubble, in order.

Step 4:

> Each card uses the `Score High / Mid / Low` component for its
> similarity tier.

The flow's summary describes those mini-cards as showing "avatar,
name, role, and the similarity score tier (High/Mid/Low)."

`citation-card.component.html` currently renders only the name and a
score chip on the same row plus a snippet beneath:

```html
<a class="citation" …>
  <div class="row">
    <strong>{{ citation.contactName }}</strong>
    <app-score-chip [value]="citation.similarity"/>
  </div>
  <p class="snippet">{{ citation.snippet }}</p>
</a>
```

There's no avatar of any kind. Sighted users see a small chunk of
text on a flat surface that doesn't visually echo the contact rows
elsewhere in the app — no quick recognition pattern, no parity with
search result cards or the contact-detail hero.

## Expected

The citation card leads with a small avatar (e.g., 28 px circle with
the contact's initials and a gradient background) so it visually
matches the contact treatment used in result cards and the contact
detail hero.

## Actual

No avatar element is rendered.

## Repro

1. Send any question from `/ask` that produces citations.
2. Inspect a `data-testid="citation-card"`.
3. There is no `.avatar` (or equivalent) child node.

## Notes

Radically simple fix: the citation already has `contactName`, so
compute initials client-side (first character of each whitespace-
delimited word, capped at 2 characters, upper-cased) and render a
circular avatar as the first child of the card. No server change is
required to derive the initials. Avatar colors stay on the default
gradient until the backend starts emitting `avatarColors` per the
flow's wire-format note.
