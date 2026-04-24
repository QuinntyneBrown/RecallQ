# T031 — Accessibility

| | |
|---|---|
| **Slice** | [24 Accessibility](../detailed-designs/24-accessibility/README.md) |
| **L2 traces** | L2-064, L2-065, L2-066, L2-067, L2-068 |
| **Prerequisites** | T003 through T025 (any UI built) |
| **Produces UI** | Yes |

## Objective

Bring every existing surface up to WCAG 2.2 AA: visible focus, logical tab order, accessible names, contrast, reduced-motion, and screen-reader-friendly streaming.

## Scope

**In:**
- Global `:focus-visible` rule using `var(--accent-tertiary)`.
- Audit + patch of all icon-only buttons to add `aria-label`.
- Ask mode conversation marked `role="log"` + `aria-live="polite"`; assistant bubble toggles `aria-busy`.
- `@media (prefers-reduced-motion: reduce)` disables pulsing / shimmer effects.
- Contrast test suite using `axe-core`.

**Out:**
- Full i18n.

## ATDD workflow

1. **Red — unit / axe**:
   - `axe_scan_passes_on_home_and_detail_and_search_and_ask` (L2-067).
   - `Home_tab_order_matches_visual_order` (L2-064) — walks `Tab` through expected sequence.
   - `All_icon_only_buttons_have_aria_label` (L2-066).
2. **Red — e2e**:
   - `T031-a11y.spec.ts` — runs the above plus `prefers-reduced-motion` emulation and asserts the pulsing dot on the suggestion card is static.
3. **Green** — patch components.

## Playwright POM

Add `fixtures/a11y.ts` with `runAxe(page, selector?): Promise<Result>`.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] No component disables focus via `outline: none` without replacing it with a visible style.
- [ ] Every page uses the correct landmark roles (`banner`, `main`, `navigation`, `contentinfo`).
- [ ] Gradient-surface text passes contrast against the **lightest** gradient stop.

## Screenshot

`docs/tasks/screenshots/T031-a11y.png` — home page at 375×667 with a focus ring visible on the search input (forced via keyboard nav).

## Definition of Done

- [x] axe scan passes on all key pages (no violations).
- [x] Keyboard walk matches the documented tab order.
- [x] Three verification passes complete clean.

**Status: Complete**
