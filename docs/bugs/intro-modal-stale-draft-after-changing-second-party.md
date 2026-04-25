# Intro modal keeps stale draft when the second party is changed

**Status:** Complete — `IntroModal.onQuery` now also clears `generated`, `subject`, and `body`, so the draft area collapses the moment the second-party search is edited.
**Flow:** [30 — Quick Action: Intro Draft](../flows/30-quick-action-intro/30-quick-action-intro.md)
**Traces:** L1-010, L2-039.
**Severity:** Medium — after `Generate draft` produces a `subject` and `body` for parties A + B, the visitor can clear or retype the second-party search box. `onQuery` correctly drops the picked second party, but it does not reset `generated`/`subject`/`body`, so the modal keeps showing the previous draft as if it still applied to whatever the visitor picks next.

## Observed

`frontend/src/app/ui/modals/intro.modal.ts`:

```ts
onQuery(e: Event) {
  this.query.set((e.target as HTMLInputElement).value);
  this.secondParty.set(null);
}
```

The template's `@if (generated())` block keeps `subject()` / `body()` on screen until the modal is closed. So the visitor sees `Picked: …` clear, the candidate list reappear, but the draft below stays — pointing at a person who is no longer the second party.

## Expected

When the visitor types in the second-party search box, the draft area should collapse so they don't accidentally Copy / Send a draft for the wrong contact.

## Fix sketch

In `onQuery`, also reset the draft state:

```ts
onQuery(e: Event) {
  this.query.set((e.target as HTMLInputElement).value);
  this.secondParty.set(null);
  this.generated.set(false);
  this.subject.set('');
  this.body.set('');
}
```
