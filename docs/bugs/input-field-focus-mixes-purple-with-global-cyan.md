# Input field focus paints purple inside the global cyan outline

**Status:** Open
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md), [02 — Authentication](../flows/02-authentication/02-authentication.md), and every form using `app-input-field`.
**Severity:** Low — visual / brand fidelity. The global focus-visible rule paints a cyan outline (`--accent-tertiary`) for accessibility (per the T031 comment in `frontend/src/styles.css`), but the input-field component's own focus rule overrides the border color and box-shadow with the purple `--accent-primary`. The two compose into a tri-coloured focus state — purple border, purple inner ring, cyan outline — which reads as a defect.

The design (`docs/ui-design.pen`) does not specify a focus state explicitly, but the project's design system standardises focus on cyan (`#4BE8FF` / `--accent-tertiary`) — the comment in `tokens.css` even calls out that change for WCAG AA on dark surfaces. Every other interactive surface in the app already routes focus through `--accent-tertiary`; this single component breaks the pattern.

## Observed

`frontend/src/app/ui/input-field/input-field.component.css`:

```css
input:focus-visible {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-primary);
}
```

## Expected

```css
input:focus-visible {
  border-color: var(--accent-tertiary);
  box-shadow: 0 0 0 2px var(--accent-tertiary);
}
```

## Fix sketch

Two-token swap. No HTML change. The global cyan outline now layers over a cyan border + cyan ring rather than fighting with purple.
