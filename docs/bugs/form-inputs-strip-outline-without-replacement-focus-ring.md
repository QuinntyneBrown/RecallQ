# Form inputs strip outline with no replacement focus ring

**Flow:** 40 — Keyboard Navigation
**Severity:** High (a11y)
**Status:** Open

## Symptom

Flow 40 alternatives:

> `outline: none` is never used without a replacement ring.

`styles.css` ships a global `input:focus-visible { outline: 2px solid
var(--accent-tertiary); … }`, but Angular's view encapsulation rewrites
component-scoped selectors with attribute scoping
(`.field[_ngcontent-c0] input[_ngcontent-c0]`), giving them higher
specificity than the global rule. Four component CSS files set
`outline: none` *without* providing a `:focus-visible` (or `:focus`)
replacement that lives in the same scope:

| File                                                          | Selector affected           |
| ------------------------------------------------------------- | --------------------------- |
| `pages/ask/ask.page.css`                                      | `.input-bar input`          |
| `pages/add-contact/add-contact.page.css`                      | `.field input, .field textarea` |
| `pages/add-interaction/add-interaction.page.css`              | `.field input, .field textarea` |
| `pages/edit-interaction/edit-interaction.page.css`            | `.field input, .field textarea` |

The Ask input bar is the app's primary chat input. With no focus
ring, a keyboard user tabbing through the page can't see where focus
landed — directly violating the flow's "visible focus ring meets a
3:1 contrast minimum" requirement.

## Expected

Tabbing into any of these inputs renders a visible focus indicator
on top of the dark surface — e.g., the same `border-color +
2 px box-shadow` pattern already used by `input-field.component.css`.

## Actual

`outline: none` wins by specificity, no replacement is provided.
Keyboard focus is invisible.

## Repro

1. Open `/ask`.
2. Press Tab until the chat input bar receives focus.
3. Observe: no visible ring around the input.
4. Repeat on `/contacts/new`, `/contacts/:id/interactions/new`, and
   `/contacts/:id/interactions/:interactionId/edit`.

## Notes

Radically simple fix: in each of the four files, add an `…
input:focus-visible` (and where applicable `… textarea:focus-visible`)
rule that mirrors `input-field.component.css`:

```css
.input-bar input:focus-visible {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-primary);
}
```

Same shape for `.field input:focus-visible` / `.field textarea:focus-visible`
in the three forms.
