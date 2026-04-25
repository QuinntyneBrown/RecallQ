# Zero-state Ask RecallQ action is not styled as a primary button

**Flow:** 18 — Search Zero-Result State
**Severity:** Medium (design fidelity)
**Status:** Complete — `.link` in `zero-state.component.css` now renders as a Button-Primary pill: 90° brand-gradient background, on-accent text, 8 / 16 px padding, full radius, and the same `0 8px 24px -4px rgba(124, 58, 255, 0.40)` shadow used by the existing Button-Primary tier.

## Symptom

Flow 18 step 3:

> Zero-state panel with heading `No matches yet`, body explaining
> the query did not match indexed contacts or interactions, and **two
> actions: `Ask RecallQ` (primary) and `Edit query` (ghost)**.

`zero-state.component.html` renders the Ask handoff as a bare link:

```html
<a [routerLink]="['/ask']" [queryParams]="q ? { q } : null" class="link">Ask RecallQ</a>
<button type="button" class="ghost" (click)="editQuery()">Edit query</button>
```

```css
.link { color: var(--accent-primary); text-decoration: none; font-weight: 600; }
.ghost { background: transparent; border: 0; color: var(--foreground-secondary); … }
```

So the "primary" CTA is a flat coloured word with no padding,
background, or border. The "ghost" treatment is correct, but the
two actions sit visually side by side as basically equal-weight text.
A user scanning the empty results panel doesn't get the cue that
Ask RecallQ is the recommended next step — it just looks like a
hyperlink in muted typography.

## Expected

Ask RecallQ renders as a Button-Primary-tier pill with the brand
gradient background, white text, shadow, and the standard 8 / 16 px
padding pattern used elsewhere in the app. Edit query stays as the
ghost text button.

## Actual

`.link` is a coloured-text-only treatment; no background, no
padding, no border-radius.

## Repro

1. Visit `/search?q=anythingthatmissesallcontacts`.
2. Observe the zero-state panel: `Ask RecallQ` and `Edit query` look
   like two equal-weight text buttons.

## Notes

Radically simple fix: update the `.link` rule in
`zero-state.component.css` to render as a Button-Primary pill —
gradient background, on-accent foreground, `border-radius: var(--radius-full)`,
`padding: 8px 16px`, plus a shadow for elevation. The existing
component class chain (anchor + `.link`) is unchanged, only the CSS
gets primary-button styling.
