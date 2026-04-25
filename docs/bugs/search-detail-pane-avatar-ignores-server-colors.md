# Search detail-pane avatar ignores server avatar colors

**Flow:** 39 — Responsive Breakpoint Resize (LG two-pane layout)
**Severity:** Medium (visual inconsistency at LG+)
**Status:** Complete — `search.page.ts` now imports the shared `avatarBackground` helper from `result-card.component.ts` and exposes `avatarBackgroundFor(c)`. The detail-pane template binds `[style.background]="avatarBackgroundFor(c)"` on `.avatar-lg`, so a contact with stored `avatarColorA/B` shows the same gradient in the result list and the detail card.

## Symptom

At LG+ (≥ 992 px) the search results page renders a two-pane layout
with the right `.detail-pane` showing a 72 px avatar circle for the
selected contact:

```html
<span class="avatar-lg" aria-hidden="true">{{ c.initials }}</span>
```

```css
.avatar-lg {
  width: 72px; height: 72px;
  …
  background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-mid));
}
```

The result-card and featured-result-card in the same page already
honor the server-provided `avatarColorA` / `avatarColorB` via
`avatarBackground()` (fix landed earlier in this loop). The detail
pane's `.avatar-lg` does not — it always renders the static brand
gradient. So at LG+ the same person is shown with one set of
colours in the list and a different set in the detail card,
breaking visual continuity for high-volume searches.

## Expected

When `selectedContact()` carries `avatarColorA` and `avatarColorB`,
the detail-pane avatar uses
`linear-gradient(135deg, <a>, <b>)` exactly like the result cards.
Without those colours it falls back to the static brand gradient.

## Actual

`avatar-lg` always shows the brand gradient regardless of the
contact's stored colours.

## Repro

1. At a viewport ≥ 992 × 700 px, mock `/api/search` to return a
   single result and `/api/contacts/{id}` to return
   `avatarColorA: '#22DD88'`, `avatarColorB: '#0088DD'`.
2. Visit `/search?q=anything`.
3. Click the result.
4. Inspect the `.detail-pane .avatar-lg` computed style — it shows
   the brand gradient, not the green/blue gradient.

## Notes

Radically simple fix: in `search.page.html` the `<span class="avatar-lg">`
already has access to `c` (the selected contact). Bind
`[style.background]` using the same shared `avatarBackground` helper
exported by `result-card.component.ts`.
