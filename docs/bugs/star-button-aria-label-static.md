# Star button aria-label doesn't reflect current state

**Flow:** 10 — Star / Unstar Contact
**Severity:** Medium (a11y, mismatched action labelling)
**Status:** Open

## Symptom

`contact-detail.page.html`:

```html
<button type="button" class="icon-btn" aria-label="Star contact" (click)="toggleStar()">
  <i class="ph"
     [class.ph-star]="!starred()"
     [class.ph-star-fill]="starred()"
     …></i>
</button>
```

The visible icon flips between outline (`ph-star`) and filled
(`ph-star-fill`) but the accessible name stays `Star contact` in
both states. So a screen-reader user hearing "Star contact, button"
on an already-starred contact would expect activation to *star* it,
when in reality activation *un-stars* it. Sighted users get the
right cue from the icon swap; SR users do not.

## Expected

The button's `aria-label` mirrors what the click will do:

- When the contact is **not** starred → `Star contact`.
- When the contact **is** starred → `Unstar contact`.

This matches the pattern Material / WAI-ARIA APG recommends for
toggle buttons whose label changes with state.

## Actual

`aria-label="Star contact"` regardless of `starred()`.

## Repro

1. Open any contact whose record has `starred: true`.
2. Inspect the star icon-button.
3. `aria-label` is `Star contact`. Tapping un-stars — but the SR
   user heard "Star contact" before tapping.

## Notes

Radically simple fix:

- Bind `[attr.aria-label]="starred() ? 'Unstar contact' : 'Star contact'"`.
- Update `e2e/pages/contact-detail.page.ts` `starButton()` to match
  either name via regex so existing tests survive the toggle.
