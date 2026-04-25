# Home Smart Stacks heading uppercases the label

**Status:** Complete — `home.page.ts` now renders `<h2 id="stacks-heading">Smart stacks <a …>See all</a></h2>`; the empty `eyebrow` class is removed.
**Flow:** [24 — Smart Stacks](../flows/24-smart-stacks/24-smart-stacks.md) (audited via Flow 39 home shell)
**Traces:** L1-006, L2-026.
**Severity:** Low — `frontend/src/app/pages/home/home.page.ts` renders the stacks-row heading as `SMART STACKS` with `class="eyebrow"`, treating it as a mono-style eyebrow. Node `0OyoH` in `docs/ui-design.pen` defines the heading as plain `Smart stacks` in Geist 17 / 700, matching the typography of the contact-detail `Recent activity` heading.

## Observed

```html
<h2 id="stacks-heading" class="eyebrow">SMART STACKS <a href="/stacks" (click)="$event.preventDefault()">See all</a></h2>
```

`.eyebrow` is not defined in the home page styles (it lives in suggestion-card / citation-card / relationship-summary-card), so the class has no effect except as a future styling hook. The literal text is the actual divergence — the design shows the mixed-case form.

## Expected

`<h2>Smart stacks</h2>` (with the existing `See all N` affordance beside it). The global `h1–h6 { font-family: 'Geist', … }` rule from `styles.css` handles the typography.

## Fix sketch

Change the literal copy from `SMART STACKS` to `Smart stacks` and drop the now-meaningless `class="eyebrow"`. Keep the existing aria id and the See-all link as-is.
