# T017 — Ask Citations

| | |
|---|---|
| **Slice** | [12 Ask citations](../detailed-designs/12-ask-citations/README.md) |
| **L2 traces** | L2-023 |
| **Prerequisites** | T016 |
| **Produces UI** | Yes |

## Objective

Append an `event: citations` SSE frame after `event: token` stream ends with up to 3 citations, rendered as `CitationCard` mini-cards inside the assistant bubble. Tapping a citation navigates to `/contacts/:id`.

## Scope

**In:**
- Server sends a `citations` event with the pre-answer retrieval top-3.
- `CitationCard` component matching `mini1`/`mini2`/`mini3` styling.
- Top citation uses violet border `#7C3AFF44`.

**Out:**
- Inline-in-text citation spans — deferred.

## ATDD workflow

1. **Red — API**:
   - `Ask_emits_citations_with_up_to_3` (L2-023).
   - `Ask_with_no_hits_omits_citations`.
2. **Red — e2e**:
   - `T017-ask-citations.spec.ts` — seed 3 contacts → ask a question → assert 3 citation cards appear → tap the first → assert navigation to that contact.
3. **Green** — implement server event + component.

## Playwright POM

Extend `AskModePage`:
```ts
citations() { return this.page.getByTestId('citation-card'); }
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Top card's border uses a CSS variable (added to `tokens.css`) — not a literal hex in the component.
- [ ] Clicking the card is a real `<a>` with `role="link"`, not a `<button>` with imperative navigation.

## Screenshot

`docs/tasks/screenshots/T017-ask-citations.png` — ask mode screen after an answer, showing 3 citation cards inside the assistant bubble.

## Definition of Done

- [ ] 2 API tests + 1 e2e pass.
- [ ] Three verification passes complete clean.
