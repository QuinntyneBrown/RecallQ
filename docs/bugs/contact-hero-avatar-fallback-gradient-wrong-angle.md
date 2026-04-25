# Contact-detail hero avatar fallback gradient uses wrong angle

**Flow:** 07 — View Contact Detail
**Severity:** Low (visual consistency)
**Status:** Open

## Symptom

Every avatar in the SPA uses a 135° diagonal gradient when no
server-provided colours are present:

| Component                          | Gradient                                             |
| ---------------------------------- | ---------------------------------------------------- |
| result-card / featured-result-card | `linear-gradient(135deg, gradient-start, …-end)`     |
| citation-card                      | `linear-gradient(135deg, gradient-start, gradient-end)` |
| contact-detail hero (server cols)  | `linear-gradient(135deg, avatarColorA, avatarColorB)` |
| contact-detail hero (CSS fallback) | `linear-gradient(gradient-start, gradient-end)` ← **no angle, defaults to `to bottom` / 180°** |

So if a contact lacks `avatarColorA/B`, the hero avatar renders a
vertical gradient while the rest of the app shows the diagonal 135°
gradient. Visiting the same contact from a result card and then
seeing the detail hero is jarring — the same person's avatar
visually shifts angle.

## Expected

The fallback CSS gradient on `.avatar` in `contact-detail.page.css`
declares `135deg` so it matches every other avatar surface in the
app.

## Actual

```css
.avatar {
  …
  background: linear-gradient(var(--accent-gradient-start), var(--accent-gradient-end));
}
```

Resolves to `to bottom` / `180deg`.

## Repro

1. Open a contact whose record has `avatarColorA` and
   `avatarColorB` null (or an old contact created before those
   columns existed).
2. Inspect `.avatar`'s computed `background-image`. It is
   `linear-gradient(rgb(...) 0%, rgb(...) 100%)` (no angle = vertical).
3. Compare with any result-card avatar in the same session —
   diagonal 135°.

## Notes

Radically simple fix: in `contact-detail.page.css`, change the
`.avatar` rule's `background:` line to
`linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-end))`.
