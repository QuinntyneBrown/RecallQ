# Ask page input focus paints purple, not cyan

**Status:** Open
**Flow:** [16 — Ask AI](../flows/16-ask-ai/16-ask-ai.md)
**Severity:** Low — visual / brand fidelity. The bottom input bar on `/ask` flips its border and box-shadow to `--accent-primary` purple on focus, while the global `:focus-visible` rule paints a cyan `--accent-tertiary` outline. Same composition gap recently patched on the input-field component (`input-field-focus-mixes-purple-with-global-cyan.md`) and on the home search pill (`home-search-input-focus-purple-not-cyan.md`) — this completes the project's cyan-only focus strategy on every text input.

The design (`docs/ui-design.pen` Ask Mode `GqJhW` → input bar `tUHxK`) does not specify a focus state, but the project's design system standardises focus on cyan.

## Observed

`frontend/src/app/pages/ask/ask.page.css`:

```css
.input-bar input:focus-visible {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-primary);
}
```

## Expected

```css
.input-bar input:focus-visible {
  border-color: var(--accent-tertiary);
  box-shadow: 0 0 0 2px var(--accent-tertiary);
}
```

## Fix sketch

Two-token swap — same shape as the previous focus-state patches.
